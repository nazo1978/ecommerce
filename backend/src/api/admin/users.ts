import { FastifyInstance } from 'fastify';
import { UserListQuery, UpdateUserRoleRequest } from '../../validation/adminSchemas';
import { AdminService } from '../../business/AdminService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerAdminUserRoutes(app: FastifyInstance, adminService: AdminService) {
  // List users
  app.get(
    '/api/v1/admin/users',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      const query = UserListQuery.parse(request.query);
      const result = await adminService.listUsers(query);
      reply.send(result);
    }
  );

  // Get user details
  app.get(
    '/api/v1/admin/users/:id',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const user = await adminService.getUserDetails(id);
        reply.send({ data: user });
      } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          });
          return;
        }
        throw error;
      }
    }
  );

  // Update user
  app.patch(
    '/api/v1/admin/users/:id',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = request.body as any;

        const user = await adminService.updateUser(id, input);
        reply.send({
          data: user,
          message: 'User updated successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          });
          return;
        }

        throw error;
      }
    }
  );

  // Delete user
  app.delete(
    '/api/v1/admin/users/:id',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        await adminService.deleteUser(id);
        reply.send({
          message: 'User deleted successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          });
          return;
        }

        throw error;
      }
    }
  );

  // Update user role
  app.patch(
    '/api/v1/admin/users/:id/role',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = UpdateUserRoleRequest.parse(request.body);

        const user = await adminService.updateUserRole(id, input.roleCode);
        reply.send({
          data: user,
          message: 'User role updated successfully',
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

        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          });
          return;
        }

        throw error;
      }
    }
  );

  // Suspend user
  app.post(
    '/api/v1/admin/users/:id/suspend',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason?: string };

      try {
        const user = await adminService.suspendUser(id, reason || 'No reason provided');
        reply.send({
          data: user,
          message: 'User suspended successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          });
          return;
        }
        throw error;
      }
    }
  );

  // Get user activity log
  app.get(
    '/api/v1/admin/users/:id/activity',
    {
      preHandler: [requirePermissions('USER_MANAGE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { limit } = request.query as { limit?: number };

      const activity = await adminService.getUserActivityLog(id, limit);
      reply.send({ data: activity });
    }
  );
}
