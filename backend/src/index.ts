import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

// Infrastructure
import { BcryptHasher } from './infrastructure/BcryptHasher';
import { JwtTokenService } from './infrastructure/JwtTokenService';
import { RedisCache } from './infrastructure/RedisCache';
import { InMemoryEventBus } from './infrastructure/InMemoryEventBus';
import { StripePaymentGateway } from './infrastructure/StripePaymentGateway';
import { WebSocketService } from './infrastructure/WebSocketService';

// Repositories
import { UserRepository } from './repositories/UserRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { OrderRepository } from './repositories/OrderRepository';
import { PaymentRepository } from './repositories/PaymentRepository';
import { AuctionRepository } from './repositories/AuctionRepository';
import { WalletRepository } from './repositories/WalletRepository';
import { LotteryRepository } from './repositories/LotteryRepository';

// Services
import { AuthService } from './business/AuthService';
import { ProductService } from './business/ProductService';
import { OrderService } from './business/OrderService';
import { PaymentService } from './business/PaymentService';
import { AdminService } from './business/AdminService';
import { AuctionService } from './business/AuctionService';
import { AutoBidService } from './business/AutoBidService';
import { LotteryService } from './business/LotteryService';

// Routes
import { registerAuthRoutes } from './api/auth/register';
import { registerLoginRoute } from './api/auth/login';
import { registerRefreshRoute } from './api/auth/refresh';
import { registerProductCreateRoute } from './api/products/create';
import { registerProductListRoute } from './api/products/list';
import { registerProductApproveRoute } from './api/products/approve';
import { registerCheckoutRoute } from './api/orders/checkout';
import { registerOrderListRoute } from './api/orders/list';
import { registerOrderCancelRoute } from './api/orders/cancel';
import { registerPaymentCreateRoute } from './api/payments/create';
import { registerPaymentWebhookRoutes } from './api/payments/webhook';
import { registerAdminDashboardRoute } from './api/admin/dashboard';
import { registerAdminUserRoutes } from './api/admin/users';
import { registerAdminSellerRoutes } from './api/admin/sellers';
import { registerAdminReportRoutes } from './api/admin/reports';
import { registerAdminProductRoutes } from './api/admin/products';
import { registerAuctionCreateRoute } from './api/auctions/create';
import { registerAuctionListRoute } from './api/auctions/list';
import { registerAuctionBidRoutes } from './api/auctions/bid';
import { registerLotteryCreateRoute } from './api/lottery/create';
import { registerLotteryListRoute } from './api/lottery/list';
import { registerLotteryTicketRoutes } from './api/lottery/ticket';
import { registerLotteryDrawRoutes } from './api/lottery/draw';

// Middleware
import { createAuthMiddleware } from './middlewares/auth';

async function bootstrap() {
  const app = Fastify({
    logger: false,
  });

  // Create HTTP server for WebSocket
  const httpServer = app.server;

  // Plugins
  await app.register(cors, {
    origin: [config.frontendUrl, config.adminUrl],
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Dependency Injection
  const hasher = new BcryptHasher();
  const tokenService = new JwtTokenService();
  const cache = new RedisCache();
  const eventBus = new InMemoryEventBus();

  const userRepository = new UserRepository();
  const productRepository = new ProductRepository();
  const orderRepository = new OrderRepository();
  const paymentRepository = new PaymentRepository();
  const auctionRepository = new AuctionRepository();
  const walletRepository = new WalletRepository();
  const lotteryRepository = new LotteryRepository();

  const paymentGateway = new StripePaymentGateway();

  const authService = new AuthService(userRepository, hasher, tokenService);
  const productService = new ProductService(productRepository);
  const orderService = new OrderService(orderRepository, productRepository, paymentRepository, eventBus);
  const paymentService = new PaymentService(paymentRepository, orderRepository, paymentGateway, eventBus);
  const adminService = new AdminService(userRepository, productRepository, orderRepository, paymentRepository);
  const auctionService = new AuctionService(auctionRepository, productRepository, walletRepository, eventBus);
  const autoBidService = new AutoBidService(auctionRepository, walletRepository, eventBus);
  const lotteryService = new LotteryService(lotteryRepository, walletRepository, eventBus);

  // WebSocket service
  const wsService = new WebSocketService(httpServer, tokenService, eventBus);

  // Global auth middleware (optional - apply selectively per route)
  const authMiddleware = createAuthMiddleware(tokenService);

  // Public routes
  registerAuthRoutes(app, authService);
  registerLoginRoute(app, authService);
  registerRefreshRoute(app, authService);
  registerProductListRoute(app, productService);
  registerPaymentWebhookRoutes(app, paymentService);

  // Protected routes (with auth middleware)
  app.addHook('onRequest', async (request, reply) => {
    const publicPaths = [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/auth/google',
      '/health',
    ];
    const publicGetPaths = ['/api/v1/products', '/api/v1/auctions', '/api/v1/lotteries'];
    const publicPostPaths = ['/api/v1/payments/webhook/stripe', '/api/v1/payments/webhook/paypal'];

    if (
      publicPaths.includes(request.url) ||
      (request.method === 'GET' && publicGetPaths.some((p) => request.url.startsWith(p))) ||
      publicPostPaths.some((p) => request.url.startsWith(p))
    ) {
      return;
    }

    await authMiddleware(request, reply);
  });

  registerProductCreateRoute(app, productService);
  registerProductApproveRoute(app, productService);
  registerCheckoutRoute(app, orderService);
  registerOrderListRoute(app, orderService);
  registerOrderCancelRoute(app, orderService);
  registerPaymentCreateRoute(app, paymentService, orderService);

  // Admin routes
  registerAdminDashboardRoute(app, adminService);
  registerAdminUserRoutes(app, adminService);
  registerAdminSellerRoutes(app, adminService);
  registerAdminReportRoutes(app, adminService);
  registerAdminProductRoutes(app, productService);

  // Auction routes
  registerAuctionCreateRoute(app, auctionService);
  registerAuctionListRoute(app, auctionService);
  registerAuctionBidRoutes(app, auctionService, autoBidService);

  // Lottery routes
  registerLotteryCreateRoute(app, lotteryService);
  registerLotteryListRoute(app, lotteryService);
  registerLotteryTicketRoutes(app, lotteryService);
  registerLotteryDrawRoutes(app, lotteryService);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Error handler
  app.setErrorHandler((error: any, request, reply) => {
    logger.error('Unhandled error', { error: error.message, stack: error.stack });
    reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  // Start server
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`📚 API Docs: http://localhost:${config.port}/health`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, closing server gracefully...`);
    await app.close();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});
