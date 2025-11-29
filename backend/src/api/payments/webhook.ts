import { FastifyInstance } from 'fastify';
import { PaymentService } from '../../business/PaymentService';

export function registerPaymentWebhookRoutes(app: FastifyInstance, paymentService: PaymentService) {
  app.post('/api/v1/payments/webhook/stripe', async (request, reply) => {
    try {
      // Production'da signature doğrulaması yapılmalı
      const result = await paymentService.handleWebhook('stripe', request.body);
      reply.send(result);
    } catch (error) {
      reply.code(400).send({
        error: {
          code: 'WEBHOOK_ERROR',
          message: 'Failed to process webhook',
        },
      });
    }
  });

  app.post('/api/v1/payments/webhook/paypal', async (request, reply) => {
    try {
      const result = await paymentService.handleWebhook('paypal', request.body);
      reply.send(result);
    } catch (error) {
      reply.code(400).send({
        error: {
          code: 'WEBHOOK_ERROR',
          message: 'Failed to process webhook',
        },
      });
    }
  });
}
