import { CreateLotteryRequestDto, BuyTicketRequestDto } from '../validation/lotterySchemas';
import { LotteryRepository } from '../repositories/LotteryRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { LotteryStatus } from '@prisma/client';
import { EventBus } from '../core/EventBus';
import { prisma } from '../config/prisma';

export class LotteryService {
  constructor(
    private readonly lotteryRepository: LotteryRepository,
    private readonly walletRepository: WalletRepository,
    private readonly eventBus: EventBus
  ) {}

  async createLottery(sellerId: string, input: CreateLotteryRequestDto) {
    const drawDate = new Date(input.drawDate);

    if (drawDate <= new Date()) {
      throw new Error('DRAW_DATE_MUST_BE_FUTURE');
    }

    if (input.maxTickets && input.maxTickets <= 0) {
      throw new Error('INVALID_MAX_TICKETS');
    }

    if (input.ticketPrice <= 0) {
      throw new Error('INVALID_TICKET_PRICE');
    }

    if (input.prizePool <= 0) {
      throw new Error('INVALID_PRIZE_POOL');
    }

    const lottery = await this.lotteryRepository.create({
      title: input.title,
      description: input.description,
      ticketPrice: input.ticketPrice,
      maxTickets: input.maxTickets,
      drawDate,
      prizePool: input.prizePool,
      status: LotteryStatus.SCHEDULED,
      createdBy: { connect: { id: sellerId } },
    });

    await this.eventBus.publish({
      type: 'LOTTERY_CREATED',
      payload: { lotteryId: lottery.id, sellerId },
      timestamp: new Date(),
    });

    return lottery;
  }

  async buyTicket(userId: string, lotteryId: string, input: BuyTicketRequestDto) {
    const lottery = await this.lotteryRepository.findById(lotteryId);
    if (!lottery) {
      throw new Error('LOTTERY_NOT_FOUND');
    }

    if (lottery.status !== LotteryStatus.ACTIVE) {
      throw new Error('LOTTERY_NOT_ACTIVE');
    }

    // Maksimum bilet kontrolü
    if (lottery.maxTickets) {
      const soldTickets = await this.lotteryRepository.getTicketCount(lotteryId);
      if (soldTickets + input.quantity > lottery.maxTickets) {
        throw new Error('MAX_TICKETS_EXCEEDED');
      }
    }

    // Çekiliş tarihi geçmiş mi?
    if (lottery.drawDate <= new Date()) {
      throw new Error('LOTTERY_EXPIRED');
    }

    // Toplam maliyet
    const totalCost = Number(lottery.ticketPrice) * input.quantity;

    // Cüzdan bakiyesi kontrolü
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet || Number(wallet.balance) < totalCost) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // Transaction ile bilet satın al
    const tickets = await prisma.$transaction(async (tx) => {
      // Bakiyeyi düş
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: totalCost,
          },
        },
      });

      // Biletleri oluştur
      const createdTickets = [];
      for (let i = 0; i < input.quantity; i++) {
        const ticket = await tx.lotteryTicket.create({
          data: {
            lotteryId,
            userId,
            ticketNumber: this.generateTicketNumber(),
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        createdTickets.push(ticket);
      }

      // Prize pool güncelle (satış gelirini ekle)
      await tx.lotteryDraw.update({
        where: { id: lotteryId },
        data: {
          prizePool: {
            increment: totalCost,
          },
        },
      });

      return createdTickets;
    });

    await this.eventBus.publish({
      type: 'LOTTERY_TICKET_PURCHASED',
      payload: {
        lotteryId,
        userId,
        quantity: input.quantity,
        totalCost,
      },
      timestamp: new Date(),
    });

    return { tickets, totalCost };
  }

  async getLottery(lotteryId: string) {
    const lottery = await this.lotteryRepository.findById(lotteryId);
    if (!lottery) {
      throw new Error('LOTTERY_NOT_FOUND');
    }
    return lottery;
  }

  async listLotteries(status?: LotteryStatus, page: number = 1, limit: number = 20) {
    return this.lotteryRepository.findMany({ status, page, limit });
  }

  async getUserTickets(userId: string, lotteryId: string) {
    return this.lotteryRepository.getUserTickets(userId, lotteryId);
  }

  async executeDraw(lotteryId: string) {
    const lottery = await this.lotteryRepository.findById(lotteryId);
    if (!lottery) {
      throw new Error('LOTTERY_NOT_FOUND');
    }

    if (lottery.status !== LotteryStatus.ACTIVE) {
      throw new Error('LOTTERY_NOT_ACTIVE');
    }

    // Tüm biletleri al
    const tickets = await this.lotteryRepository.getAllTickets(lotteryId);
    if (tickets.length === 0) {
      throw new Error('NO_TICKETS_SOLD');
    }

    // Kazanan sayısı (örnek: toplam biletlerin %5'i veya minimum 1)
    const winnerCount = Math.max(1, Math.floor(tickets.length * 0.05));

    // Rastgele kazananlar seç
    const winners = this.selectRandomWinners(tickets, winnerCount);

    // Ödül dağılımı (örnek: 1. kazanan %50, 2. kazanan %30, 3. kazanan %20)
    const prizeDistribution = this.calculatePrizeDistribution(
      Number(lottery.prizePool),
      winnerCount
    );

    // Transaction ile kazananları işaretle ve ödül dağıt
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < winners.length; i++) {
        const ticket = winners[i];
        const prizeAmount = prizeDistribution[i];

        // Bileti kazanan olarak işaretle
        await tx.lotteryTicket.update({
          where: { id: ticket.id },
          data: {
            isWinner: true,
            prizeAmount,
          },
        });

        // Kazanana ödül aktar
        await tx.wallet.update({
          where: { userId: ticket.userId },
          data: {
            balance: {
              increment: prizeAmount,
            },
          },
        });
      }

      // Çekilişi tamamlandı olarak işaretle
      await tx.lotteryDraw.update({
        where: { id: lotteryId },
        data: {
          status: LotteryStatus.COMPLETED,
        },
      });
    });

    await this.eventBus.publish({
      type: 'LOTTERY_DRAW_COMPLETED',
      payload: {
        lotteryId,
        winnerCount: winners.length,
        totalPrize: lottery.prizePool,
      },
      timestamp: new Date(),
    });

    return {
      winners: winners.map((ticket, i) => ({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        userId: ticket.userId,
        user: ticket.user,
        prizeAmount: prizeDistribution[i],
      })),
      totalPrize: lottery.prizePool,
    };
  }

  async cancelLottery(lotteryId: string, sellerId: string) {
    const lottery = await this.lotteryRepository.findById(lotteryId);
    if (!lottery) {
      throw new Error('LOTTERY_NOT_FOUND');
    }

    if (lottery.createdById !== sellerId) {
      throw new Error('FORBIDDEN');
    }

    if (lottery.status === LotteryStatus.COMPLETED) {
      throw new Error('LOTTERY_ALREADY_COMPLETED');
    }

    // Bilet satıldıysa iade işlemi
    const tickets = await this.lotteryRepository.getAllTickets(lotteryId);
    if (tickets.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Her kullanıcıya bilet parasını iade et
        for (const ticket of tickets) {
          await tx.wallet.update({
            where: { userId: ticket.userId },
            data: {
              balance: {
                increment: Number(lottery.ticketPrice),
              },
            },
          });
        }

        // Çekilişi iptal et
        await tx.lotteryDraw.update({
          where: { id: lotteryId },
          data: {
            status: LotteryStatus.CANCELLED,
          },
        });
      });
    } else {
      // Bilet yoksa direkt iptal
      await this.lotteryRepository.update(lotteryId, {
        status: LotteryStatus.CANCELLED,
      });
    }

    await this.eventBus.publish({
      type: 'LOTTERY_CANCELLED',
      payload: { lotteryId, sellerId },
      timestamp: new Date(),
    });

    return { success: true, refundedTickets: tickets.length };
  }

  // Scheduler için - zamanı gelen çekilişleri aktifleştir
  async activateScheduledLotteries() {
    const lotteries = await this.lotteryRepository.getScheduledDraws();

    for (const lottery of lotteries) {
      // SCHEDULED -> ACTIVE (bilet satışı başladı)
      await this.lotteryRepository.update(lottery.id, {
        status: LotteryStatus.ACTIVE,
      });

      await this.eventBus.publish({
        type: 'LOTTERY_ACTIVATED',
        payload: { lotteryId: lottery.id },
        timestamp: new Date(),
      });
    }

    return lotteries.length;
  }

  // Scheduler için - çekiliş tarihi gelen çekilişleri yürüt
  async executeScheduledDraws() {
    const lotteries = await this.lotteryRepository.getActiveDraws();
    let executedCount = 0;

    for (const lottery of lotteries) {
      // Çekiliş tarihi geçmiş mi?
      if (lottery.drawDate <= new Date()) {
        try {
          await this.executeDraw(lottery.id);
          executedCount++;
        } catch (error) {
          console.error(`Failed to execute draw ${lottery.id}:`, error);
        }
      }
    }

    return executedCount;
  }

  // Helper: Rastgele kazananlar seç
  private selectRandomWinners(tickets: any[], count: number): any[] {
    const shuffled = [...tickets].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, tickets.length));
  }

  // Helper: Ödül dağılımını hesapla
  private calculatePrizeDistribution(totalPrize: number, winnerCount: number): number[] {
    if (winnerCount === 1) {
      return [totalPrize];
    }

    if (winnerCount === 2) {
      return [totalPrize * 0.6, totalPrize * 0.4];
    }

    if (winnerCount === 3) {
      return [totalPrize * 0.5, totalPrize * 0.3, totalPrize * 0.2];
    }

    // 4+ kazanan için: ilk 3'e sabit dağılım, geri kalanına eşit
    const firstThree = [totalPrize * 0.4, totalPrize * 0.25, totalPrize * 0.15];
    const remaining = totalPrize * 0.2;
    const remainingCount = winnerCount - 3;
    const remainingPrize = remaining / remainingCount;

    return [...firstThree, ...Array(remainingCount).fill(remainingPrize)];
  }

  // Helper: Bilet numarası oluştur (örnek: L-20250129-A1B2C3)
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `L-${timestamp}-${random}`;
  }
}
