import { Payment, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  async findByProviderRef(providerRef: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { providerRef },
    });
  }

  async create(data: any) {
    return prisma.payment.create({ data });
  }

  async update(id: string, data: any) {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
