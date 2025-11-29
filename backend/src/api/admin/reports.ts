import { FastifyInstance } from 'fastify';
import { AdminService } from '../../business/AdminService';
import { requirePermissions } from '../../middlewares/auth';
import { z } from 'zod';

const RevenueReportQuery = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export function registerAdminReportRoutes(app: FastifyInstance, adminService: AdminService) {
  // Revenue report
  app.get(
    '/api/v1/admin/reports/revenue',
    {
      preHandler: [requirePermissions('REPORT_VIEW')],
    },
    async (request, reply) => {
      try {
        const query = RevenueReportQuery.parse(request.query);
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);

        const report = await adminService.getRevenueReport(startDate, endDate);
        reply.send({ data: report });
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid date range',
              details: error.errors,
            },
          });
          return;
        }
        throw error;
      }
    }
  );

  // Product analytics
  app.get(
    '/api/v1/admin/reports/products',
    {
      preHandler: [requirePermissions('REPORT_VIEW')],
    },
    async (request, reply) => {
      const analytics = await adminService.getProductAnalytics();
      reply.send({ data: analytics });
    }
  );
}
