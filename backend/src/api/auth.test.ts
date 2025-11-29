import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from '../api/auth/register';
import { registerLoginRoute } from '../api/auth/login';
import { UserRepository } from '../repositories/UserRepository';
import { BcryptHasher } from '../infrastructure/BcryptHasher';
import { JwtTokenService } from '../infrastructure/JwtTokenService';
import { AuthService } from '../business/AuthService';

describe('Auth API Integration Tests', () => {
  let app: FastifyInstance;
  let authService: AuthService;

  beforeAll(async () => {
    app = Fastify();
    
    // Setup services
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService();
    const userRepository = new UserRepository();
    authService = new AuthService(userRepository, hasher, tokenService);

    // Register routes
    registerAuthRoutes(app, authService);
    registerLoginRoute(app, authService);

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: `test-${Date.now()}@example.com`,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.data.user).toBeDefined();
      expect(json.data.user.email).toBeDefined();
      expect(json.data.tokens.accessToken).toBeDefined();
      expect(json.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: `test-${Date.now()}@example.com`,
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      const email = `test-${Date.now()}@example.com`;
      
      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      // Duplicate registration
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email,
          password: 'Password123!',
          firstName: 'Test2',
          lastName: 'User2',
        },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    beforeAll(async () => {
      // Create a test user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: testEmail,
          password: testPassword,
          firstName: 'Login',
          lastName: 'Test',
        },
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data.user).toBeDefined();
      expect(json.data.user.email).toBe(testEmail);
      expect(json.data.tokens.accessToken).toBeDefined();
      expect(json.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testEmail,
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject login with missing credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
