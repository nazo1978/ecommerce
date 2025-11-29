import { FastifyInstance } from 'fastify';
import { AuctionService } from '../../business/AuctionService';
import { z } from 'zod';

const AuctionListQuery = z.object({
  status: z.enum(['SCHEDULED', 'RUNNING', 'ENDED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function registerAuctionListRoute(app: FastifyInstance, auctionService: AuctionService) {
  app.get('/api/v1/auctions', async (request, reply) => {
    const query = AuctionListQuery.parse(request.query);
    const result = await auctionService.listAuctions(query.status as any, query.page, query.limit);

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

  app.get('/api/v1/auctions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const auction = await auctionService.getAuction(id);
      reply.send({ data: auction });
    } catch (error) {
      if (error instanceof Error && error.message === 'AUCTION_NOT_FOUND') {
        reply.code(404).send({
          error: { code: 'AUCTION_NOT_FOUND', message: 'Auction not found' },
        });
        return;
      }
      throw error;
    }
  });
}
