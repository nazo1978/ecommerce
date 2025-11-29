import { FastifyInstance } from 'fastify';
import { RefreshTokenRequest } from '../../validation/authSchemas';
import { AuthService } from '../../business/AuthService';
import { ZodError } from 'zod';

export function registerRefreshRoute(app: FastifyInstance, authService: AuthService) {
  app.post('/api/v1/auth/refresh', async (request, reply) => {
    try {
      const input = RefreshTokenRequest.parse(request.body);
      const result = await authService.refreshToken(input.refreshToken);

      reply.send({
        data: result.tokens,
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

      if (error instanceof Error && error.message === 'INVALID_REFRESH_TOKEN') {
        reply.code(401).send({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token is invalid or expired',
          },
        });
        return;
      }

      throw error;
    }
  });
}
