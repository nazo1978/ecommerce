import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { WalletRepository } from '../repositories/WalletRepository';
import { UserRepository } from '../repositories/UserRepository';
import { BcryptHasher } from '../infrastructure/BcryptHasher';
import { JwtTokenService } from '../infrastructure/JwtTokenService';
import { AuthService } from '../business/AuthService';
import { registerLoginRoute } from './auth/login';
import { createAuthMiddleware } from '../middlewares/auth';

describe('Wallet API Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let walletRepository: WalletRepository;

  beforeAll(async () => {
    app = Fastify();
    
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService();
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository, hasher, tokenService);
    walletRepository = new WalletRepository();
    const authMiddleware = createAuthMiddleware(tokenService);

    registerLoginRoute(app, authService);

    // Wallet routes with auth
    app.get('/api/v1/wallet', { preHandler: [authMiddleware] }, async (request, reply) => {
      const user = (request as any).user;
      const wallet = await walletRepository.findByUserId(user.userId);
      reply.send({ data: wallet });
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get wallet balance for authenticated user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
    expect(data.data.balance).toBeDefined();
  });

  it('should reject wallet access without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet',
    });

    expect(response.statusCode).toBe(401);
  });
});
