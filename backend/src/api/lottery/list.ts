import { FastifyInstance } from 'fastify';
import { LotteryService } from '../../business/LotteryService';
import { z } from 'zod';

const LotteryListQuery = z.object({
  status: z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function registerLotteryListRoute(app: FastifyInstance, lotteryService: LotteryService) {
  app.get('/api/v1/lotteries', async (request, reply) => {
    const query = LotteryListQuery.parse(request.query);
    const result = await lotteryService.listLotteries(query.status as any, query.page, query.limit);

    reply.send({
      data: result.data,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    });
  });

  app.get('/api/v1/lotteries/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const lottery = await lotteryService.getLottery(id);
      reply.send({ data: lottery });
    } catch (error) {
      if (error instanceof Error && error.message === 'LOTTERY_NOT_FOUND') {
        reply.code(404).send({
          error: { code: 'LOTTERY_NOT_FOUND', message: 'Lottery not found' },
        });
        return;
      }
      throw error;
    }
  });
}
