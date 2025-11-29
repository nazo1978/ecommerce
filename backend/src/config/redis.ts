import Redis from 'ioredis';
import { config } from './env';
import { logger } from './logger';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times) => {
    // Disable retries after 3 attempts
    if (times > 3) {
      logger.warn('Redis unavailable, using in-memory cache');
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err: any) => {
  // Suppress connection errors
  if (err.code !== 'ECONNREFUSED') {
    logger.error('Redis error', err);
  }
});

// Try to connect, but don't fail if Redis is unavailable
redis.connect().catch(() => {
  logger.warn('Redis connection failed, using in-memory cache as fallback');
});
