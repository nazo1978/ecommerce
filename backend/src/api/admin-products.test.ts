import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from './auth/register';
import { registerLoginRoute } from './auth/login';
import { registerAdminProductRoutes } from './admin/products';
import { UserRepository } from '../repositories/UserRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { BcryptHasher } from '../infrastructure/BcryptHasher';
import { JwtTokenService } from '../infrastructure/JwtTokenService';
import { AuthService } from '../business/AuthService';
import { ProductService } from '../business/ProductService';
import { createAuthMiddleware } from '../middlewares/auth';

describe('Admin Product Management', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let productId: string;

  beforeAll(async () => {
    app = Fastify();
    
    // Setup services
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService();
    const userRepository = new UserRepository();
    const productRepository = new ProductRepository();
    const authService = new AuthService(userRepository, hasher, tokenService);
    const productService = new ProductService(productRepository);
    const authMiddleware = createAuthMiddleware(tokenService);

    // Register routes
    registerAuthRoutes(app, authService);
    registerLoginRoute(app, authService);
    registerAdminProductRoutes(app, productService);

    // Add auth middleware
    app.addHook('onRequest', async (request, reply) => {
      const publicPaths = ['/api/v1/auth/register', '/api/v1/auth/login'];
      if (publicPaths.includes(request.url)) {
        return;
      }
      await authMiddleware(request, reply);
    });

    await app.ready();
    
    // Login as admin to get token
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@ecommerce.com',
        password: 'password123',
      },
    });

    const data = JSON.parse(response.body);
    adminToken = data.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/admin/products', () => {
    it('should create a new product', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Test Product',
          description: 'This is a test product',
          price: 99.99,
          stock: 100,
          category: 'Electronics',
          status: 'DRAFT',
          images: ['https://example.com/image1.jpg'],
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe('Test Product');
      expect(data.data.price).toBe(99.99);
      expect(data.data.stock).toBe(100);
      expect(data.data.category).toBe('Electronics');
      expect(data.data.status).toBe('DRAFT');
      
      productId = data.data.id;
    });

    it('should reject product creation without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        payload: {
          name: 'Test Product',
          description: 'This is a test product',
          price: 99.99,
          stock: 100,
          category: 'Electronics',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject product with missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Test Product',
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject product with invalid price', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Test Product',
          description: 'Test',
          price: -10,
          stock: 100,
          category: 'Electronics',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject product with invalid stock', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Test Product',
          description: 'Test',
          price: 99.99,
          stock: -5,
          category: 'Electronics',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/admin/products', () => {
    it('should list all products with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products?page=1&limit=10',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data).toHaveProperty('data');
      expect(data.data).toHaveProperty('meta');
      expect(Array.isArray(data.data.data)).toBe(true);
      expect(data.data.meta).toHaveProperty('page');
      expect(data.data.meta).toHaveProperty('limit');
      expect(data.data.meta).toHaveProperty('total');
    });

    it('should filter products by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products?category=Electronics',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      data.data.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should filter products by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products?status=PUBLISHED',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      data.data.data.forEach((product: any) => {
        expect(product.status).toBe('PUBLISHED');
      });
    });

    it('should search products by name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products?q=Test',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(Array.isArray(data.data.data)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/products/:id', () => {
    it('should get a single product by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/products/${productId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.id).toBe(productId);
      expect(data.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products/non-existent-id',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/v1/admin/products/:id', () => {
    it('should update product details', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/products/${productId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Updated Test Product',
          price: 149.99,
          stock: 50,
          status: 'PUBLISHED',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.name).toBe('Updated Test Product');
      expect(data.data.price).toBe(149.99);
      expect(data.data.stock).toBe(50);
      expect(data.data.status).toBe('PUBLISHED');
    });

    it('should reject update with invalid price', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/products/${productId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          price: -50,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject update without auth', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/products/${productId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/admin/products/:id', () => {
    it('should delete a product', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${productId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      
      // Verify product is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/products/${productId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      
      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent product', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/admin/products/non-existent-id',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject delete without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${productId}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Product Validation', () => {
    it('should validate product name length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'AB', // Too short
          description: 'Test',
          price: 99.99,
          stock: 10,
          category: 'Electronics',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate description length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Test Product',
          description: 'AB', // Too short
          price: 99.99,
          stock: 10,
          category: 'Electronics',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate category is not empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Test Product',
          description: 'Test description',
          price: 99.99,
          stock: 10,
          category: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple product creation', async () => {
      const products = [
        {
          name: 'Bulk Product 1',
          description: 'Description 1',
          price: 10.99,
          stock: 5,
          category: 'Electronics',
          status: 'DRAFT',
        },
        {
          name: 'Bulk Product 2',
          description: 'Description 2',
          price: 20.99,
          stock: 10,
          category: 'Books',
          status: 'PUBLISHED',
        },
      ];

      for (const product of products) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/admin/products',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: product,
        });

        expect(response.statusCode).toBe(201);
      }
    });
  });
});
