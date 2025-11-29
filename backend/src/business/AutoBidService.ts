import { PlaceBidRequestDto } from '../validation/auctionSchemas';
import { AuctionRepository } from '../repositories/AuctionRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { AuctionStatus } from '@prisma/client';
import { EventBus } from '../core/EventBus';

interface AutoBidConfig {
  userId: string;
  auctionId: string;
  maxBid: number;
  increment: number;
}

export class AutoBidService {
  private autoBids: Map<string, AutoBidConfig[]> = new Map(); // auctionId -> configs

  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly walletRepository: WalletRepository,
    private readonly eventBus: EventBus
  ) {
    // BID_PLACED event'ini dinle
    this.eventBus.subscribe('BID_PLACED', this.handleBidPlaced.bind(this));
  }

  async enableAutoBid(userId: string, auctionId: string, maxBid: number, increment: number = 1) {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    if (auction.status !== AuctionStatus.RUNNING) {
      throw new Error('AUCTION_NOT_RUNNING');
    }

    // Satıcı auto-bid yapamaz
    if (auction.product.sellerId === userId) {
      throw new Error('SELLER_CANNOT_BID');
    }

    // Cüzdan kontrolü
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet || Number(wallet.balance) < maxBid) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // Auto-bid config kaydet
    const configs = this.autoBids.get(auctionId) || [];
    
    // Varsa güncelle, yoksa ekle
    const existingIndex = configs.findIndex((c) => c.userId === userId);
    const config: AutoBidConfig = { userId, auctionId, maxBid, increment };

    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }

    this.autoBids.set(auctionId, configs);

    return { success: true, maxBid, increment };
  }

  async disableAutoBid(userId: string, auctionId: string) {
    const configs = this.autoBids.get(auctionId);
    if (!configs) {
      return { success: true };
    }

    const filtered = configs.filter((c) => c.userId !== userId);
    if (filtered.length > 0) {
      this.autoBids.set(auctionId, filtered);
    } else {
      this.autoBids.delete(auctionId);
    }

    return { success: true };
  }

  private async handleBidPlaced(event: any) {
    const { auctionId, userId, amount } = event.payload;

    const configs = this.autoBids.get(auctionId);
    if (!configs || configs.length === 0) {
      return;
    }

    // Teklifi veren kullanıcı hariç, diğer auto-bid kullanıcıları için
    for (const config of configs) {
      if (config.userId === userId) {
        continue; // Kendi teklifine karşı auto-bid yapma
      }

      // Max bid kontrolü
      const newBidAmount = Number(amount) + config.increment;
      if (newBidAmount > config.maxBid) {
        // Max limit aşıldı, auto-bid'i devre dışı bırak
        await this.disableAutoBid(config.userId, auctionId);
        continue;
      }

      // Cüzdan bakiyesi kontrolü
      const wallet = await this.walletRepository.findByUserId(config.userId);
      if (!wallet || Number(wallet.balance) < newBidAmount) {
        await this.disableAutoBid(config.userId, auctionId);
        continue;
      }

      // Otomatik teklif ver
      try {
        const bid = await this.auctionRepository.createBid({
          auction: { connect: { id: auctionId } },
          user: { connect: { id: config.userId } },
          amount: newBidAmount,
          isAutoBid: true,
          maxAutoBid: config.maxBid,
        });

        // Açık artırmayı güncelle
        await this.auctionRepository.update(auctionId, {
          currentBid: newBidAmount,
        });

        // Event yayınla
        await this.eventBus.publish({
          type: 'BID_PLACED',
          payload: {
            auctionId,
            bidId: bid.id,
            userId: config.userId,
            amount: newBidAmount,
            currentBid: newBidAmount,
            isAutoBid: true,
          },
          timestamp: new Date(),
        });

        // Sadece bir auto-bid kazanır, diğerleri sırada bekler
        break;
      } catch (error) {
        console.error('Auto-bid error:', error);
        await this.disableAutoBid(config.userId, auctionId);
      }
    }
  }

  getAutoBidStatus(userId: string, auctionId: string) {
    const configs = this.autoBids.get(auctionId);
    if (!configs) {
      return null;
    }

    return configs.find((c) => c.userId === userId) || null;
  }
}
