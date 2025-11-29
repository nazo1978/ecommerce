import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { PaymentGateway } from '../core/PaymentGateway';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { EventBus } from '../core/EventBus';

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly eventBus: EventBus
  ) {}

  async createPayment(userId: string, orderId: string, provider: 'stripe' | 'paypal' | 'wallet') {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error('ORDER_NOT_PENDING_PAYMENT');
    }

    // Ödeme authorize et
    const result = await this.paymentGateway.authorize({
      amount: Number(order.totalAmount),
      currency: order.currency,
      description: `Order #${order.id}`,
      metadata: {
        orderId: order.id,
        userId,
      },
    });

    // Payment kaydı oluştur
    const payment = await this.paymentRepository.create({
      user: { connect: { id: userId } },
      amount: order.totalAmount,
      currency: order.currency,
      status: result.status === 'AUTHORIZED' ? PaymentStatus.AUTHORIZED : PaymentStatus.FAILED,
      provider: result.provider,
      providerRef: result.providerRef,
      metadata: {
        orderId: order.id,
      },
    });

    // Event yayınla
    await this.eventBus.publish({
      type: 'PAYMENT_AUTHORIZED',
      payload: { paymentId: payment.id, orderId, userId },
      timestamp: new Date(),
    });

    return payment;
  }

  async capturePayment(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status !== PaymentStatus.AUTHORIZED) {
      throw new Error('PAYMENT_NOT_AUTHORIZED');
    }

    // Payment capture et
    const result = await this.paymentGateway.capture(payment.providerRef!);

    // Payment durumunu güncelle
    const updatedPayment = await this.paymentRepository.update(paymentId, {
      status: result.status === 'CAPTURED' ? PaymentStatus.CAPTURED : PaymentStatus.FAILED,
    });

    // Event yayınla
    await this.eventBus.publish({
      type: 'PAYMENT_CAPTURED',
      payload: { paymentId, status: updatedPayment.status },
      timestamp: new Date(),
    });

    return updatedPayment;
  }

  async refundPayment(paymentId: string, amount?: number) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new Error('PAYMENT_NOT_CAPTURED');
    }

    // Refund işlemi
    const result = await this.paymentGateway.refund(
      payment.providerRef!,
      amount ? amount : Number(payment.amount)
    );

    // Payment durumunu güncelle
    const updatedPayment = await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
    });

    // Event yayınla
    await this.eventBus.publish({
      type: 'PAYMENT_REFUNDED',
      payload: { paymentId, amount: amount || payment.amount },
      timestamp: new Date(),
    });

    return updatedPayment;
  }

  async handleWebhook(provider: string, payload: any) {
    // Webhook signature doğrulaması yapılmalı (provider'a göre)
    
    // Provider'a göre webhook işle
    if (provider === 'stripe') {
      return this.handleStripeWebhook(payload);
    } else if (provider === 'paypal') {
      return this.handlePayPalWebhook(payload);
    }

    throw new Error('UNSUPPORTED_PROVIDER');
  }

  private async handleStripeWebhook(payload: any) {
    // Stripe webhook event'lerini işle
    const event = payload;

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Ödeme başarılı
        const paymentIntent = event.data.object;
        const payment = await this.paymentRepository.findByProviderRef(paymentIntent.id);
        
        if (payment) {
          await this.paymentRepository.update(payment.id, {
            status: PaymentStatus.CAPTURED,
          });

          await this.eventBus.publish({
            type: 'PAYMENT_WEBHOOK_RECEIVED',
            payload: { provider: 'stripe', event: event.type, paymentId: payment.id },
            timestamp: new Date(),
          });
        }
        break;

      case 'payment_intent.payment_failed':
        // Ödeme başarısız
        const failedIntent = event.data.object;
        const failedPayment = await this.paymentRepository.findByProviderRef(failedIntent.id);
        
        if (failedPayment) {
          await this.paymentRepository.update(failedPayment.id, {
            status: PaymentStatus.FAILED,
          });
        }
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePayPalWebhook(payload: any) {
    // PayPal webhook event'lerini işle
    // Benzer mantık Stripe ile
    return { received: true };
  }
}
