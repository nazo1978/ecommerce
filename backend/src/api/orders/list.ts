import { FastifyInstance } from 'fastify';
import { OrderService } from '../../business/OrderService';
import { requirePermissions } from '../../middlewares/auth';

export function registerOrderListRoute(app: FastifyInstance, orderService: OrderService) {
  app.get(
    '/api/v1/orders',
    {
      preHandler: [requirePermissions('ORDER_CREATE')],
    },
    async (request, reply) => {
      const user = (request as any).user;
      const orders = await orderService.getUserOrders(user.sub);

      reply.send({
        data: orders,
        meta: {
          total: orders.length,
        },
      });
    }
  );

  app.get(
    '/api/v1/orders/:id',
    {
      preHandler: [requirePermissions('ORDER_CREATE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      try {
        const order = await orderService.getOrderById(id, user.sub);
        reply.send({ data: order });
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
        }

        throw error;
      }
    }
  );
}
