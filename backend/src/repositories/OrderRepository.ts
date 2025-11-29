import { Order, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { OrderStatus } from '../types/enums';

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return prisma.order.create({
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findPendingPaymentOrders(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        userId,
        status: 'PENDING_PAYMENT',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    return prisma.order.count({
      where: { status },
    });
  }
}
