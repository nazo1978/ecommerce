import { FastifyInstance } from 'fastify';
import { CreateLotteryRequest } from '../../validation/lotterySchemas';
import { LotteryService } from '../../business/LotteryService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerLotteryCreateRoute(app: FastifyInstance, lotteryService: LotteryService) {
  app.post(
    '/api/v1/lotteries',
    {
      preHandler: [requirePermissions('LOTTERY_CREATE')],
    },
    async (request, reply) => {
      try {
        const input = CreateLotteryRequest.parse(request.body);
        const user = (request as any).user;

        const lottery = await lotteryService.createLottery(user.sub, input);

        reply.code(201).send({
          data: lottery,
          message: 'Lottery created successfully',
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
          const errorMessages: Record<string, { code: number; message: string }> = {
            DRAW_DATE_MUST_BE_FUTURE: { code: 400, message: 'Draw date must be in the future' },
            INVALID_MAX_TICKETS: { code: 400, message: 'Max tickets must be greater than 0' },
            INVALID_TICKET_PRICE: { code: 400, message: 'Ticket price must be greater than 0' },
            INVALID_PRIZE_POOL: { code: 400, message: 'Prize pool must be greater than 0' },
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
