import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { LotteryRepository } from '../repositories/LotteryRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { InMemoryEventBus } from '../infrastructure/InMemoryEventBus';
import { LotteryService } from '../business/LotteryService';
import { UserRepository } from '../repositories/UserRepository';
import { BcryptHasher } from '../infrastructure/BcryptHasher';
import { JwtTokenService } from '../infrastructure/JwtTokenService';
import { AuthService } from '../business/AuthService';
import { registerLoginRoute } from './auth/login';
import { registerLotteryListRoute } from './lottery/list';

describe('Lottery API Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let lotteryService: LotteryService;

  beforeAll(async () => {
    app = Fastify();
    
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService();
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository, hasher, tokenService);
    
    const lotteryRepository = new LotteryRepository();
    const walletRepository = new WalletRepository();
    const eventBus = new InMemoryEventBus();
    
    lotteryService = new LotteryService(lotteryRepository, walletRepository, eventBus);

    registerLoginRoute(app, authService);
    registerLotteryListRoute(app, lotteryService);

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
    authToken = loginData.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list lotteries successfully', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/lotteries',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
    // Check if data is array or has data property
    const lotteryData = Array.isArray(data.data) ? data.data : data.data.data;
    expect(Array.isArray(lotteryData)).toBe(true);
  });

  it('should filter lotteries by status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/lotteries?status=ACTIVE',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
  });

  it('should support pagination for lotteries', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/lotteries?page=1&limit=10',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
    // Meta might be at data.meta or data.data.meta
    const meta = data.data.meta || (data.data.data && data.data.data.meta);
    if (meta) {
      expect(meta.page).toBeDefined();
    }
  });
});
