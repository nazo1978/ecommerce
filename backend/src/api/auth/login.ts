import { FastifyInstance } from 'fastify';
import { LoginRequest } from '../../validation/authSchemas';
import { AuthService } from '../../business/AuthService';
import { ZodError } from 'zod';

export function registerLoginRoute(app: FastifyInstance, authService: AuthService) {
  app.post('/api/v1/auth/login', async (request, reply) => {
    try {
      const input = LoginRequest.parse(request.body);
      const result = await authService.login(input);

      reply.send({
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            primaryRole: result.user.primaryRole,
          },
          tokens: result.tokens,
        },
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

      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        reply.code(401).send({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
        return;
      }

      throw error;
    }
  });
}
