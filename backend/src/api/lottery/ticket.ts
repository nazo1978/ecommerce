import { FastifyInstance } from 'fastify';
import { BuyTicketRequest } from '../../validation/lotterySchemas';
import { LotteryService } from '../../business/LotteryService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerLotteryTicketRoutes(app: FastifyInstance, lotteryService: LotteryService) {
  // Buy tickets
  app.post(
    '/api/v1/lotteries/:id/tickets',
    {
      preHandler: [requirePermissions('LOTTERY_PARTICIPATE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = BuyTicketRequest.parse(request.body);
        const user = (request as any).user;

        const result = await lotteryService.buyTicket(user.sub, id, input);

        reply.code(201).send({
          data: result,
          message: 'Tickets purchased successfully',
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
            LOTTERY_NOT_FOUND: { code: 404, message: 'Lottery not found' },
            LOTTERY_NOT_ACTIVE: { code: 400, message: 'Lottery is not active' },
            MAX_TICKETS_EXCEEDED: { code: 400, message: 'Maximum tickets exceeded' },
            LOTTERY_EXPIRED: { code: 400, message: 'Lottery draw date has passed' },
            INSUFFICIENT_BALANCE: { code: 400, message: 'Insufficient wallet balance' },
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

  // Get user's tickets for a lottery
  app.get(
    '/api/v1/lotteries/:id/my-tickets',
    {
      preHandler: [requirePermissions('LOTTERY_PARTICIPATE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      const tickets = await lotteryService.getUserTickets(user.sub, id);
      reply.send({ data: tickets });
    }
  );
}
