import { FastifyInstance } from 'fastify';
import { CreateAuctionRequest } from '../../validation/auctionSchemas';
import { AuctionService } from '../../business/AuctionService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerAuctionCreateRoute(app: FastifyInstance, auctionService: AuctionService) {
  app.post(
    '/api/v1/auctions',
    {
      preHandler: [requirePermissions('AUCTION_CREATE')],
    },
    async (request, reply) => {
      try {
        const input = CreateAuctionRequest.parse(request.body);
        const user = (request as any).user;

        const auction = await auctionService.createAuction(user.sub, input);

        reply.code(201).send({
          data: auction,
          message: 'Auction created successfully',
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
            PRODUCT_NOT_FOUND: { code: 404, message: 'Product not found' },
            FORBIDDEN: { code: 403, message: 'You do not own this product' },
            PRODUCT_NOT_PUBLISHED: { code: 400, message: 'Product must be published' },
            INVALID_TIME_RANGE: { code: 400, message: 'End time must be after start time' },
            START_TIME_PAST: { code: 400, message: 'Start time cannot be in the past' },
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
