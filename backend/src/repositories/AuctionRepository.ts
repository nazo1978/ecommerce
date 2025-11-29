import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuctionStatus } from '../types/enums';

export class AuctionRepository {
  async findById(id: string) {
    return prisma.auction.findUnique({
      where: { id },
      include: {
        product: true,
        bids: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findMany(params: {
    status?: AuctionStatus;
    page: number;
    limit: number;
  }) {
    const { status, page, limit } = params;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          product: true,
          _count: {
            select: {
              bids: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { endTime: 'asc' },
      }),
      prisma.auction.count({ where }),
    ]);

    return { data: auctions, total };
  }

  async create(data: any) {
    return prisma.auction.create({
      data,
      include: {
        product: true,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.auction.update({
      where: { id },
      data,
      include: {
        product: true,
        bids: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async getActiveBids(auctionId: string) {
    return prisma.auctionBid.findMany({
      where: { auctionId },
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
      orderBy: {
        amount: 'desc',
      },
    });
  }

  async getUserBids(userId: string, auctionId: string) {
    return prisma.auctionBid.findMany({
      where: {
        userId,
        auctionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createBid(data: any) {
    return prisma.auctionBid.create({
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
        auction: true,
      },
    });
  }

  async getRunningAuctions() {
    return prisma.auction.findMany({
      where: {
        status: 'RUNNING' as AuctionStatus,
        endTime: {
          lte: new Date(),
        },
      },
      include: {
        product: true,
        bids: {
          orderBy: {
            amount: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async getScheduledAuctions() {
    return prisma.auction.findMany({
      where: {
        status: 'SCHEDULED' as AuctionStatus,
        startTime: {
          lte: new Date(),
        },
      },
    });
  }
}
