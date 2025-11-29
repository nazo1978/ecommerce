import { CheckoutRequestDto } from '../validation/orderSchemas';
import { OrderRepository } from '../repositories/OrderRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderStatus, PaymentStatus, ProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { EventBus } from '../core/EventBus';

interface StockReservation {
  productId: string;
  quantity: number;
  reservedStock: number;
}

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly eventBus: EventBus
  ) {}

  async checkout(userId: string, input: CheckoutRequestDto, idempotencyKey?: string) {
    // Idempotency kontrolü
    if (idempotencyKey) {
      const existingOrder = await this.checkIdempotency(userId, idempotencyKey);
      if (existingOrder) {
        return existingOrder;
      }
    }

    // Ürün validasyonu ve stok kontrolü
    const validatedItems = await this.validateAndCalculateOrder(input.items);

    // Transaction içinde sipariş oluştur ve stok rezerve et
    const order = await prisma.$transaction(async (tx) => {
      // Stok rezervasyonu
      const reservations: StockReservation[] = [];

      for (const item of validatedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND: ${item.productId}`);
        }

        if (product.status !== ProductStatus.PUBLISHED) {
          throw new Error(`PRODUCT_NOT_AVAILABLE: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK: ${item.productId}`);
        }

        // Stok rezerve et (geçici olarak düş)
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        reservations.push({
          productId: item.productId,
          quantity: item.quantity,
          reservedStock: product.stock - item.quantity,
        });
      }

      // Toplam tutarı hesapla
      const totalAmount = validatedItems.reduce((sum, item) => sum + item.total, 0);

      // Sipariş oluştur
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: OrderStatus.PENDING_PAYMENT,
          currency: 'USD',
          shippingInfo: input.shippingInfo,
          billingInfo: input.billingInfo || input.shippingInfo,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return newOrder;
    });

    // Event yayınla
    await this.eventBus.publish({
      type: 'ORDER_CREATED',
      payload: { orderId: order.id, userId },
      timestamp: new Date(),
    });

    return order;
  }

  async confirmPayment(orderId: string, paymentId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error('ORDER_NOT_PENDING_PAYMENT');
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment || payment.status !== PaymentStatus.CAPTURED) {
      throw new Error('PAYMENT_NOT_CAPTURED');
    }

    // Siparişi PAID durumuna geçir
    const updatedOrder = await this.orderRepository.update(orderId, {
      status: OrderStatus.PAID,
      paymentId,
    });

    // Event yayınla
    await this.eventBus.publish({
      type: 'ORDER_PAID',
      payload: { orderId, paymentId },
      timestamp: new Date(),
    });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }

    if (![OrderStatus.PENDING_PAYMENT, OrderStatus.PAID].includes(order.status)) {
      throw new Error('ORDER_CANNOT_BE_CANCELLED');
    }

    // Transaction içinde stokları geri al ve siparişi iptal et
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Stokları geri al
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Siparişi iptal et
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    // Event yayınla
    await this.eventBus.publish({
      type: 'ORDER_CANCELLED',
      payload: { orderId, userId },
      timestamp: new Date(),
    });

    return cancelledOrder;
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }

    return order;
  }

  private async validateAndCalculateOrder(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<Array<{ productId: string; quantity: number; unitPrice: number; total: number }>> {
    const validatedItems = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);

      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND: ${item.productId}`);
      }

      if (product.status !== ProductStatus.PUBLISHED) {
        throw new Error(`PRODUCT_NOT_AVAILABLE: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK: ${item.productId} (Available: ${product.stock})`);
      }

      const unitPrice = Number(product.price);
      const total = unitPrice * item.quantity;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
      });
    }

    return validatedItems;
  }

  private async checkIdempotency(userId: string, idempotencyKey: string) {
    // Redis veya DB'de idempotency key kontrolü yapılabilir
    // Şimdilik basit bir implementasyon
    const recentOrders = await this.orderRepository.findPendingPaymentOrders(userId);
    
    // Son 5 dakika içinde aynı tutar ve ürünlerle sipariş var mı kontrol et
    // Bu production'da daha sofistike olmalı (Redis hash kullanarak)
    
    return null; // Şimdilik her zaman yeni sipariş oluştur
  }
}
