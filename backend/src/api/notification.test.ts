import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { UserRepository } from '../repositories/UserRepository';
import { BcryptHasher } from '../infrastructure/BcryptHasher';
import { JwtTokenService } from '../infrastructure/JwtTokenService';
import { AuthService } from '../business/AuthService';
import { registerLoginRoute } from './auth/login';
import { createAuthMiddleware } from '../middlewares/auth';
import { prisma } from '../config/prisma';

describe('Notification API Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = Fastify();
    
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService();
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository, hasher, tokenService);
    const authMiddleware = createAuthMiddleware(tokenService);

    registerLoginRoute(app, authService);

    // Notification routes with auth
    app.get('/api/v1/notifications', { preHandler: [authMiddleware] }, async (request, reply) => {
      const user = (request as any).user;
      
      const notifications = await prisma.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      reply.send({ data: notifications });
    });

    await app.ready();

    // Login to get token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'customer@ecommerce.com',
        password: 'password123',
      },
    });

    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.data.tokens.accessToken;
    userId = loginData.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get user notifications', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should require authentication for notifications', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
    });

    expect(response.statusCode).toBe(401);
  });
});
