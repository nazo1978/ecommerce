import { FastifyInstance } from 'fastify';
import { RegisterRequest } from '../../validation/authSchemas';
import { AuthService } from '../../business/AuthService';
import { ZodError } from 'zod';

export function registerAuthRoutes(app: FastifyInstance, authService: AuthService) {
  app.post('/api/v1/auth/register', async (request, reply) => {
    try {
      const input = RegisterRequest.parse(request.body);
      const result = await authService.register(input);

      reply.code(201).send({
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
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

      if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
        reply.code(409).send({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email already registered',
          },
        });
        return;
      }

      throw error;
    }
  });

  // Google OAuth endpoint
  app.post('/api/v1/auth/google', async (request, reply) => {
    try {
      const { credential } = request.body as { credential: string };

      // Decode Google JWT
      const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
      const { email, given_name, family_name, picture } = payload;

      // Use AuthService to handle Google login
      const result = await authService.loginOrCreateWithGoogle({
        email,
        firstName: given_name || 'User',
        lastName: family_name || '',
        avatar: picture,
      });

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
      request.log.error('Google auth error', error);
      reply.code(401).send({
        error: {
          code: 'GOOGLE_AUTH_FAILED',
          message: 'Google authentication failed',
        },
      });
    }
  });
}
