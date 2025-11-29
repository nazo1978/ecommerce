import { PaymentGateway, PaymentRequest, PaymentResult } from '../core/PaymentGateway';
import { config } from '../config/env';
import { logger } from '../config/logger';

// Mock implementation - production'da gerçek Stripe SDK kullanılmalı
export class StripePaymentGateway implements PaymentGateway {
  async authorize(req: PaymentRequest): Promise<PaymentResult> {
    logger.info('Stripe authorize', { amount: req.amount, currency: req.currency });

    // Mock implementation
    // Production'da: const stripe = require('stripe')(config.stripe.secretKey);
    // const paymentIntent = await stripe.paymentIntents.create({...});

    return {
      provider: 'stripe',
      providerRef: `pi_mock_${Date.now()}`,
      status: 'AUTHORIZED',
    };
  }

  async capture(providerRef: string): Promise<PaymentResult> {
    logger.info('Stripe capture', { providerRef });

    // Mock implementation
    // Production'da: await stripe.paymentIntents.capture(providerRef);

    return {
      provider: 'stripe',
      providerRef,
      status: 'CAPTURED',
    };
  }

  async refund(providerRef: string, amount?: number): Promise<PaymentResult> {
    logger.info('Stripe refund', { providerRef, amount });

    // Mock implementation
    // Production'da: await stripe.refunds.create({...});

    return {
      provider: 'stripe',
      providerRef: `re_mock_${Date.now()}`,
      status: 'CAPTURED', // Refund başarılı, orijinal status CAPTURED
    };
  }
}
