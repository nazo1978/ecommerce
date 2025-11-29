import { FastifyInstance } from 'fastify';
import { AdminService } from '../../business/AdminService';
import { requirePermissions } from '../../middlewares/auth';

export function registerAdminDashboardRoute(app: FastifyInstance, adminService: AdminService) {
  app.get(
    '/api/v1/admin/dashboard',
    {
      preHandler: [requirePermissions('ADMIN_READ')],
    },
    async (_request, reply) => {
      const stats = await adminService.getDashboardStats();
      reply.send({ data: stats });
    }
  );
}
