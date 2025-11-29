import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/UserRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { UserRoleEnum } from '../types/enums';

export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository
  ) {}

  // User Management
  async listUsers(params: {
    q?: string;
    role?: string;
    emailVerified?: boolean;
    page: number;
    limit: number;
  }) {
    const { q, role, emailVerified, page, limit } = params;

    const where: any = {};

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.primaryRole = role as UserRoleEnum;
    }

    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          primaryRole: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              products: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            products: true,
            auctionBids: true,
            lotteryTickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }

  async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    primaryRole?: UserRoleEnum;
    emailVerified?: boolean;
  }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return this.userRepository.update(userId, data);
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  async updateUserRole(userId: string, roleCode: UserRoleEnum) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return this.userRepository.update(userId, {
      primaryRole: roleCode,
    });
  }

  async suspendUser(userId: string, reason: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // TODO: Add suspended field to User model
    // For now, we can use a workaround or add to metadata
    return this.userRepository.update(userId, {
      emailVerified: false, // Temporary suspension mechanism
    });
  }

  // Seller Management
  async listSellers(page: number, limit: number) {
    const [sellers, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          primaryRole: 'SELLER',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: { primaryRole: 'SELLER' },
      }),
    ]);

    return {
      data: sellers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveSeller(userId: string, approved: boolean, reason?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.primaryRole !== 'SELLER') {
      throw new Error('USER_NOT_SELLER');
    }

    // Approve or reject seller
    return this.userRepository.update(userId, {
      emailVerified: approved, // Using emailVerified as approval flag
    });
  }

  // Dashboard & Analytics
  async getDashboardStats() {
    const [
      totalUsers,
      totalCustomers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingProducts,
      pendingPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { primaryRole: 'CUSTOMER' } }),
      prisma.user.count({ where: { primaryRole: 'SELLER' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.payment.aggregate({
        where: { status: 'CAPTURED' },
        _sum: { amount: true },
      }),
      prisma.product.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    ]);

    // Recent activity
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        primaryRole: true,
        createdAt: true,
      },
    });

    return {
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          sellers: totalSellers,
        },
        products: {
          total: totalProducts,
          pending: pendingProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingPayments,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
        },
      },
      recentActivity: {
        orders: recentOrders,
        users: recentUsers,
      },
    };
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'CAPTURED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const averageTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;

    // Group by day
    const dailyRevenue = payments.reduce((acc: any, payment: any) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }
      acc[date].amount += Number(payment.amount);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; amount: number; count: number }>);

    return {
      summary: {
        totalRevenue,
        totalTransactions: payments.length,
        averageTransaction,
      },
      dailyBreakdown: Object.values(dailyRevenue),
      transactions: payments.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        provider: p.provider,
        userEmail: p.user.email,
        createdAt: p.createdAt,
      })),
    };
  }

  async getProductAnalytics() {
    const [
      totalProducts,
      byStatus,
      byCategory,
      topSelling,
      lowStock,
    ] = await Promise.all([
      prisma.product.count(),
      
      prisma.product.groupBy({
        by: ['status'],
        _count: true,
      }),
      
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
        take: 10,
      }),
      
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      }),
      
      prisma.product.findMany({
        where: {
          stock: {
            lte: 10,
          },
          status: 'PUBLISHED',
        },
        take: 20,
        orderBy: {
          stock: 'asc',
        },
      }),
    ]);

    // Get product details for top selling
    const topSellingProducts = await Promise.all(
      topSelling.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
          },
        });
        return {
          ...product,
          soldQuantity: item._sum.quantity,
        };
      })
    );

    return {
      total: totalProducts,
      byStatus: byStatus.map((s: any) => ({
        status: s.status,
        count: s._count,
      })),
      byCategory: byCategory.map((c: any) => ({
        category: c.category,
        count: c._count,
      })),
      topSelling: topSellingProducts,
      lowStock,
    };
  }

  async getUserActivityLog(userId: string, limit: number = 50) {
    const [orders, products, payments] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { sellerId: userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      orders,
      products,
      payments,
    };
  }
}
