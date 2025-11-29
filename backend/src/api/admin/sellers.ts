import { FastifyInstance } from 'fastify';
import { ApproveSellerRequest } from '../../validation/adminSchemas';
import { AdminService } from '../../business/AdminService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerAdminSellerRoutes(app: FastifyInstance, adminService: AdminService) {
  // List sellers
  app.get(
    '/api/v1/admin/sellers',
    {
      preHandler: [requirePermissions('SELLER_APPROVE')],
    },
    async (request, reply) => {
      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
      const result = await adminService.listSellers(Number(page), Number(limit));
      reply.send(result);
    }
  );

  // Approve or reject seller
  app.post(
    '/api/v1/admin/sellers/:id/approve',
    {
      preHandler: [requirePermissions('SELLER_APPROVE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = ApproveSellerRequest.parse(request.body);

        const seller = await adminService.approveSeller(id, input.approved, input.reason);

        reply.send({
          data: seller,
          message: input.approved ? 'Seller approved successfully' : 'Seller rejected',
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
          if (error.message === 'USER_NOT_FOUND') {
            reply.code(404).send({
              error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
          }

          if (error.message === 'USER_NOT_SELLER') {
            reply.code(400).send({
              error: { code: 'USER_NOT_SELLER', message: 'User is not a seller' },
            });
            return;
          }
        }

        throw error;
      }
    }
  );
}
