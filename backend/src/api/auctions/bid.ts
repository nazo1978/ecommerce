import { FastifyInstance } from 'fastify';
import { PlaceBidRequest } from '../../validation/auctionSchemas';
import { AuctionService } from '../../business/AuctionService';
import { AutoBidService } from '../../business/AutoBidService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerAuctionBidRoutes(
  app: FastifyInstance,
  auctionService: AuctionService,
  autoBidService: AutoBidService
) {
  // Place manual bid
  app.post(
    '/api/v1/auctions/:id/bid',
    {
      preHandler: [requirePermissions('AUCTION_BID')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = PlaceBidRequest.parse(request.body);
        const user = (request as any).user;

        const result = await auctionService.placeBid(user.sub, id, input);

        reply.code(201).send({
          data: result,
          message: 'Bid placed successfully',
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
            AUCTION_NOT_FOUND: { code: 404, message: 'Auction not found' },
            AUCTION_NOT_RUNNING: { code: 400, message: 'Auction is not running' },
            SELLER_CANNOT_BID: { code: 403, message: 'Sellers cannot bid on their own auctions' },
            BID_TOO_LOW: { code: 400, message: 'Bid amount is too low' },
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

  // Buy now
  app.post(
    '/api/v1/auctions/:id/buy-now',
    {
      preHandler: [requirePermissions('AUCTION_BID')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        const auction = await auctionService.buyNow(user.sub, id);

        reply.send({
          data: auction,
          message: 'Purchase successful. Auction ended.',
        });
      } catch (error) {
        if (error instanceof Error) {
          const errorMessages: Record<string, { code: number; message: string }> = {
            AUCTION_NOT_FOUND: { code: 404, message: 'Auction not found' },
            AUCTION_NOT_RUNNING: { code: 400, message: 'Auction is not running' },
            BUY_NOW_NOT_AVAILABLE: { code: 400, message: 'Buy now option is not available' },
            SELLER_CANNOT_BUY: { code: 403, message: 'Sellers cannot buy their own products' },
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

  // Enable auto-bid
  app.post(
    '/api/v1/auctions/:id/auto-bid',
    {
      preHandler: [requirePermissions('AUCTION_BID')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { maxBid, increment } = request.body as { maxBid: number; increment?: number };
      const user = (request as any).user;

      try {
        const result = await autoBidService.enableAutoBid(user.sub, id, maxBid, increment || 1);
        reply.send({
          data: result,
          message: 'Auto-bid enabled successfully',
        });
      } catch (error) {
        if (error instanceof Error) {
          const errorMessages: Record<string, { code: number; message: string }> = {
            AUCTION_NOT_FOUND: { code: 404, message: 'Auction not found' },
            AUCTION_NOT_RUNNING: { code: 400, message: 'Auction is not running' },
            SELLER_CANNOT_BID: { code: 403, message: 'Sellers cannot auto-bid' },
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

  // Disable auto-bid
  app.delete(
    '/api/v1/auctions/:id/auto-bid',
    {
      preHandler: [requirePermissions('AUCTION_BID')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      const result = await autoBidService.disableAutoBid(user.sub, id);
      reply.send({
        data: result,
        message: 'Auto-bid disabled successfully',
      });
    }
  );

  // Get auto-bid status
  app.get(
    '/api/v1/auctions/:id/auto-bid',
    {
      preHandler: [requirePermissions('AUCTION_BID')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      const status = autoBidService.getAutoBidStatus(user.sub, id);
      reply.send({ data: status });
    }
  );
}
