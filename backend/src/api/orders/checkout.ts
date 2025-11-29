import { FastifyInstance } from 'fastify';
import { CheckoutRequest } from '../../validation/orderSchemas';
import { OrderService } from '../../business/OrderService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerCheckoutRoute(app: FastifyInstance, orderService: OrderService) {
  app.post(
    '/api/v1/orders/checkout',
    {
      preHandler: [requirePermissions('ORDER_CREATE')],
    },
    async (request, reply) => {
      try {
        const input = CheckoutRequest.parse(request.body);
        const user = (request as any).user;
        const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

        const order = await orderService.checkout(user.sub, input, idempotencyKey);

        reply.code(201).send({
          data: order,
          message: 'Order created successfully. Please proceed with payment.',
        });
      } catch (error) {
        if (error instanceof ZodError) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
              details: error.errors,
            },
          });
          return;
        }

        if (error instanceof Error) {
          if (error.message.startsWith('PRODUCT_NOT_FOUND')) {
            reply.code(404).send({
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: error.message,
              },
            });
            return;
          }

          if (error.message.startsWith('PRODUCT_NOT_AVAILABLE')) {
            reply.code(400).send({
              error: {
                code: 'PRODUCT_NOT_AVAILABLE',
                message: error.message,
              },
            });
            return;
          }

          if (error.message.startsWith('INSUFFICIENT_STOCK')) {
            reply.code(400).send({
              error: {
                code: 'INSUFFICIENT_STOCK',
                message: error.message,
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
