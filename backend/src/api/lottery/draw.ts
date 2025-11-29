import { FastifyInstance } from 'fastify';
import { LotteryService } from '../../business/LotteryService';
import { requirePermissions } from '../../middlewares/auth';

export function registerLotteryDrawRoutes(app: FastifyInstance, lotteryService: LotteryService) {
  // Execute draw (Admin only)
  app.post(
    '/api/v1/lotteries/:id/draw',
    {
      preHandler: [requirePermissions('LOTTERY_MANAGE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await lotteryService.executeDraw(id);

        reply.send({
          data: result,
          message: 'Draw executed successfully',
        });
      } catch (error) {
        if (error instanceof Error) {
          const errorMessages: Record<string, { code: number; message: string }> = {
            LOTTERY_NOT_FOUND: { code: 404, message: 'Lottery not found' },
            LOTTERY_NOT_ACTIVE: { code: 400, message: 'Lottery is not active' },
            NO_TICKETS_SOLD: { code: 400, message: 'No tickets sold for this lottery' },
          };

          const err = errorMessages[error.message];
          if (err) {
            reply.code(err.code).send({
              error: { code: error.message, message: err.message },
            });
            return;
          }
        }

        throw error;
      }
    }
  );

  // Cancel lottery
  app.post(
    '/api/v1/lotteries/:id/cancel',
    {
      preHandler: [requirePermissions('LOTTERY_CREATE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        const result = await lotteryService.cancelLottery(id, user.sub);

        reply.send({
          data: result,
          message: 'Lottery cancelled successfully',
        });
      } catch (error) {
        if (error instanceof Error) {
          const errorMessages: Record<string, { code: number; message: string }> = {
            LOTTERY_NOT_FOUND: { code: 404, message: 'Lottery not found' },
            FORBIDDEN: { code: 403, message: 'You do not own this lottery' },
            LOTTERY_ALREADY_COMPLETED: { code: 400, message: 'Lottery already completed' },
          };

          const err = errorMessages[error.message];
          if (err) {
            reply.code(err.code).send({
              error: { code: error.message, message: err.message },
            });
            return;
          }
        }

        throw error;
      }
    }
  );
}
