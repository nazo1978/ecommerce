import { Wallet, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class WalletRepository {
  async findByUserId(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async findById(id: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.WalletCreateInput): Promise<Wallet> {
    return prisma.wallet.create({ data });
  }

  async update(id: string, data: Prisma.WalletUpdateInput): Promise<Wallet> {
    return prisma.wallet.update({
      where: { id },
      data,
    });
  }

  async addBalance(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.findByUserId(userId);
    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND');
    }

    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  async deductBalance(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.findByUserId(userId);
    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND');
    }

    if (Number(wallet.balance) < amount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });
  }
}
