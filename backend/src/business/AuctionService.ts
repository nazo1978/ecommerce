import { CreateAuctionRequestDto, PlaceBidRequestDto } from '../validation/auctionSchemas';
import { AuctionRepository } from '../repositories/AuctionRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { AuctionStatus, ProductStatus } from '@prisma/client';
import { EventBus } from '../core/EventBus';

export class AuctionService {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly productRepository: ProductRepository,
    private readonly walletRepository: WalletRepository,
    private readonly eventBus: EventBus
  ) {}

  async createAuction(sellerId: string, input: CreateAuctionRequestDto) {
    // Ürün kontrolü
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.sellerId !== sellerId) {
      throw new Error('FORBIDDEN');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new Error('PRODUCT_NOT_PUBLISHED');
    }

    // Tarih validasyonu
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (startTime >= endTime) {
      throw new Error('INVALID_TIME_RANGE');
    }

    if (startTime < new Date()) {
      throw new Error('START_TIME_PAST');
    }

    // Açık artırma oluştur
    const auction = await this.auctionRepository.create({
      product: { connect: { id: input.productId } },
      startPrice: input.startPrice,
      currentBid: input.startPrice,
      buyNowPrice: input.buyNowPrice,
      startTime,
      endTime,
      autoExtend: input.autoExtend,
      status: AuctionStatus.SCHEDULED,
    });

    await this.eventBus.publish({
      type: 'AUCTION_CREATED',
      payload: { auctionId: auction.id, sellerId },
      timestamp: new Date(),
    });

    return auction;
  }

  async placeBid(userId: string, auctionId: string, input: PlaceBidRequestDto) {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    if (auction.status !== AuctionStatus.RUNNING) {
      throw new Error('AUCTION_NOT_RUNNING');
    }

    // Satıcı kendi açık artırmasına teklif veremez
    if (auction.product.sellerId === userId) {
      throw new Error('SELLER_CANNOT_BID');
    }

    // Teklif miktarı kontrolü
    const minBidIncrement = 1; // Minimum artış miktarı
    if (input.amount <= Number(auction.currentBid) + minBidIncrement) {
      throw new Error('BID_TOO_LOW');
    }

    // Cüzdan bakiyesi kontrolü (opsiyonel - teklif aşamasında tutulabilir)
    const wallet = await this.walletRepository.findByUserId(userId);
    if (wallet && Number(wallet.balance) < input.amount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // Teklif kaydet
    const bid = await this.auctionRepository.createBid({
      auction: { connect: { id: auctionId } },
      user: { connect: { id: userId } },
      amount: input.amount,
      isAutoBid: input.isAutoBid || false,
      maxAutoBid: input.maxAutoBid,
    });

    // Açık artırmayı güncelle
    const updatedAuction = await this.auctionRepository.update(auctionId, {
      currentBid: input.amount,
    });

    // Son 5 dakika içinde teklif gelirse süreyi uzat (auto-extend)
    if (auction.autoExtend) {
      const timeRemaining = auction.endTime.getTime() - new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;

      if (timeRemaining < fiveMinutes) {
        const newEndTime = new Date(auction.endTime.getTime() + fiveMinutes);
        await this.auctionRepository.update(auctionId, {
          endTime: newEndTime,
        });

        await this.eventBus.publish({
          type: 'AUCTION_EXTENDED',
          payload: { auctionId, newEndTime },
          timestamp: new Date(),
        });
      }
    }

    // Event yayınla (WebSocket için)
    await this.eventBus.publish({
      type: 'BID_PLACED',
      payload: {
        auctionId,
        bidId: bid.id,
        userId,
        amount: input.amount,
        currentBid: updatedAuction.currentBid,
      },
      timestamp: new Date(),
    });

    return { bid, auction: updatedAuction };
  }

  async buyNow(userId: string, auctionId: string) {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    if (auction.status !== AuctionStatus.RUNNING) {
      throw new Error('AUCTION_NOT_RUNNING');
    }

    if (!auction.buyNowPrice) {
      throw new Error('BUY_NOW_NOT_AVAILABLE');
    }

    // Satıcı kendi ürününü alamaz
    if (auction.product.sellerId === userId) {
      throw new Error('SELLER_CANNOT_BUY');
    }

    // Cüzdan bakiyesi kontrolü
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet || Number(wallet.balance) < Number(auction.buyNowPrice)) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // Açık artırmayı sonlandır
    const updatedAuction = await this.auctionRepository.update(auctionId, {
      status: AuctionStatus.ENDED,
      winnerId: userId,
      currentBid: auction.buyNowPrice,
    });

    await this.eventBus.publish({
      type: 'AUCTION_BUY_NOW',
      payload: { auctionId, winnerId: userId, amount: auction.buyNowPrice },
      timestamp: new Date(),
    });

    return updatedAuction;
  }

  async getAuction(auctionId: string) {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error('AUCTION_NOT_FOUND');
    }
    return auction;
  }

  async listAuctions(status?: AuctionStatus, page: number = 1, limit: number = 20) {
    return this.auctionRepository.findMany({ status, page, limit });
  }

  async getUserBids(userId: string, auctionId: string) {
    return this.auctionRepository.getUserBids(userId, auctionId);
  }

  async endAuction(auctionId: string) {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    if (auction.status !== AuctionStatus.RUNNING) {
      throw new Error('AUCTION_NOT_RUNNING');
    }

    // En yüksek teklifi bul
    const bids = await this.auctionRepository.getActiveBids(auctionId);
    const winningBid = bids.length > 0 ? bids[0] : null;

    // Açık artırmayı bitir
    const updatedAuction = await this.auctionRepository.update(auctionId, {
      status: AuctionStatus.ENDED,
      winnerId: winningBid?.userId || null,
    });

    await this.eventBus.publish({
      type: 'AUCTION_ENDED',
      payload: {
        auctionId,
        winnerId: winningBid?.userId,
        winningAmount: winningBid?.amount,
      },
      timestamp: new Date(),
    });

    return updatedAuction;
  }

  async cancelAuction(auctionId: string, sellerId: string) {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    if (auction.product.sellerId !== sellerId) {
      throw new Error('FORBIDDEN');
    }

    if (auction.status === AuctionStatus.ENDED) {
      throw new Error('AUCTION_ALREADY_ENDED');
    }

    // Teklif varsa iptal edilemez
    const bids = await this.auctionRepository.getActiveBids(auctionId);
    if (bids.length > 0) {
      throw new Error('AUCTION_HAS_BIDS');
    }

    const updatedAuction = await this.auctionRepository.update(auctionId, {
      status: AuctionStatus.CANCELLED,
    });

    await this.eventBus.publish({
      type: 'AUCTION_CANCELLED',
      payload: { auctionId, sellerId },
      timestamp: new Date(),
    });

    return updatedAuction;
  }

  // Scheduler için - başlaması gereken açık artırmaları başlat
  async startScheduledAuctions() {
    const auctions = await this.auctionRepository.getScheduledAuctions();

    for (const auction of auctions) {
      await this.auctionRepository.update(auction.id, {
        status: AuctionStatus.RUNNING,
      });

      await this.eventBus.publish({
        type: 'AUCTION_STARTED',
        payload: { auctionId: auction.id },
        timestamp: new Date(),
      });
    }

    return auctions.length;
  }

  // Scheduler için - bitmesi gereken açık artırmaları bitir
  async endRunningAuctions() {
    const auctions = await this.auctionRepository.getRunningAuctions();

    for (const auction of auctions) {
      await this.endAuction(auction.id);
    }

    return auctions.length;
  }
}
