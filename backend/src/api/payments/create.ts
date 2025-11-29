import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PaymentService } from '../../business/PaymentService';
import { OrderService } from '../../business/OrderService';
import { requirePermissions } from '../../middlewares/auth';

const CreatePaymentRequest = z.object({
  orderId: z.string(),
  provider: z.enum(['stripe', 'paypal', 'wallet']),
});

export function registerPaymentCreateRoute(
  app: FastifyInstance,
  paymentService: PaymentService,
  orderService: OrderService
) {
  app.post(
    '/api/v1/payments',
    {
      preHandler: [requirePermissions('PAYMENT_USE')],
    },
    async (request, reply) => {
      try {
        const input = CreatePaymentRequest.parse(request.body);
        const user = (request as any).user;

        // Ödeme oluştur
        const payment = await paymentService.createPayment(user.sub, input.orderId, input.provider);

        // Eğer authorize başarılıysa, otomatik capture yap
        if (payment.status === 'AUTHORIZED') {
          const capturedPayment = await paymentService.capturePayment(payment.id);

          // Siparişi PAID durumuna geçir
          await orderService.confirmPayment(input.orderId, capturedPayment.id);

          reply.code(201).send({
            data: capturedPayment,
            message: 'Payment successful. Your order has been confirmed.',
          });
        } else {
          reply.code(400).send({
            error: {
              code: 'PAYMENT_FAILED',
              message: 'Payment authorization failed',
            },
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'ORDER_NOT_FOUND') {
            reply.code(404).send({
              error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
            });
            return;
          }

          if (error.message === 'FORBIDDEN') {
            reply.code(403).send({
              error: { code: 'FORBIDDEN', message: 'You do not have access to this order' },
            });
            return;
          }

          if (error.message === 'ORDER_NOT_PENDING_PAYMENT') {
            reply.code(400).send({
              error: {
                code: 'ORDER_NOT_PENDING_PAYMENT',
                message: 'Order is not awaiting payment',
              },
            });
            return;
          }
        }

        throw error;
      }
    }
  );
}
