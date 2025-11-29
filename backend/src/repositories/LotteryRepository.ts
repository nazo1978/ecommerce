import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { LotteryStatus } from '../types/enums';

export class LotteryRepository {
  async findById(id: string) {
    return prisma.lotteryDraw.findUnique({
      where: { id },
      include: {
        tickets: {
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
        },
        winners: {
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
        },
      },
    });
  }

  async findMany(params: {
    status?: LotteryStatus;
    page: number;
    limit: number;
  }) {
    const { status, page, limit } = params;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [lotteries, total] = await Promise.all([
      prisma.lotteryDraw.findMany({
        where,
        include: {
          _count: {
            select: {
              tickets: true,
              winners: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { drawDate: 'desc' },
      }),
      prisma.lotteryDraw.count({ where }),
    ]);

    return { data: lotteries, total };
  }

  async create(data: any) {
    return prisma.lotteryDraw.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.lotteryDraw.update({
      where: { id },
      data,
    });
  }

  async createTicket(data: any) {
    return prisma.lotteryTicket.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        lottery: true,
      },
    });
  }

  async getUserTickets(userId: string, lotteryId: string) {
    return prisma.lotteryTicket.findMany({
      where: {
        userId,
        lotteryId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTicketCount(lotteryId: string): Promise<number> {
    return prisma.lotteryTicket.count({
      where: { lotteryId },
    });
  }

  async getAllTickets(lotteryId: string) {
    return prisma.lotteryTicket.findMany({
      where: { lotteryId },
      include: {
        user: true,
      },
    });
  }

  async getScheduledDraws() {
    return prisma.lotteryDraw.findMany({
      where: {
        status: 'SCHEDULED' as LotteryStatus,
        drawDate: {
          lte: new Date(),
        },
      },
    });
  }

  async getActiveDraws() {
    return prisma.lotteryDraw.findMany({
      where: {
        status: 'ACTIVE' as LotteryStatus,
      },
    });
  }

  async markTicketAsWinner(ticketId: string, prizeAmount: number) {
    return prisma.lotteryTicket.update({
      where: { id: ticketId },
      data: {
        isWinner: true,
        prizeAmount,
      },
    });
  }
}
