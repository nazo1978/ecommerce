import { FastifyInstance } from 'fastify';
import { OrderService } from '../../business/OrderService';
import { requirePermissions } from '../../middlewares/auth';

export function registerOrderCancelRoute(app: FastifyInstance, orderService: OrderService) {
  app.post(
    '/api/v1/orders/:id/cancel',
    {
      preHandler: [requirePermissions('ORDER_CREATE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      try {
        const order = await orderService.cancelOrder(id, user.sub);

        reply.send({
          data: order,
          message: 'Order cancelled successfully. Stock has been restored.',
        });
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

          if (error.message === 'ORDER_CANNOT_BE_CANCELLED') {
            reply.code(400).send({
              error: {
                code: 'ORDER_CANNOT_BE_CANCELLED',
                message: 'Order cannot be cancelled in its current status',
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
