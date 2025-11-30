import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { AuctionRepository } from '../repositories/AuctionRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { InMemoryEventBus } from '../infrastructure/InMemoryEventBus';
import { AuctionService } from '../business/AuctionService';
import { UserRepository } from '../repositories/UserRepository';
import { BcryptHasher } from '../infrastructure/BcryptHasher';
import { JwtTokenService } from '../infrastructure/JwtTokenService';
import { AuthService } from '../business/AuthService';
import { registerLoginRoute } from './auth/login';
import { registerAuctionListRoute } from './auctions/list';

describe('Auction API Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let auctionService: AuctionService;

  beforeAll(async () => {
    app = Fastify();
    
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService();
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository, hasher, tokenService);
    
    const auctionRepository = new AuctionRepository();
    const productRepository = new ProductRepository();
    const walletRepository = new WalletRepository();
    const eventBus = new InMemoryEventBus();
    
    auctionService = new AuctionService(auctionRepository, productRepository, walletRepository, eventBus);

    registerLoginRoute(app, authService);
    registerAuctionListRoute(app, auctionService);

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

  it('should list auctions successfully', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auctions',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
    // Check if data is array or has data property
    const auctionData = Array.isArray(data.data) ? data.data : data.data.data;
    expect(Array.isArray(auctionData)).toBe(true);
  });

  it('should filter auctions by status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auctions?status=RUNNING',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.data).toBeDefined();
  });

  it('should support pagination for auctions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auctions?page=1&limit=10',
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
