import { Cache } from '../core/Cache';
import { redis } from '../config/redis';
import { InMemoryCache } from './InMemoryCache';
import { logger } from '../config/logger';

export class RedisCache implements Cache {
  private fallbackCache = new InMemoryCache();
  private isRedisAvailable = false;

  constructor() {
    // Check Redis availability
    redis.ping()
      .then(() => {
        this.isRedisAvailable = true;
        logger.info('Redis cache enabled');
      })
      .catch(() => {
        this.isRedisAvailable = false;
        logger.info('Using in-memory cache (Redis unavailable)');
      });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable) {
      return this.fallbackCache.get<T>(key);
    }

    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      return this.fallbackCache.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isRedisAvailable) {
      return this.fallbackCache.set(key, value, ttlSeconds);
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      return this.fallbackCache.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisAvailable) {
      return this.fallbackCache.del(key);
    }

    try {
      await redis.del(key);
    } catch (error) {
      return this.fallbackCache.del(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isRedisAvailable) {
      return this.fallbackCache.exists(key);
    }

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      return this.fallbackCache.exists(key);
    }
  }
}
