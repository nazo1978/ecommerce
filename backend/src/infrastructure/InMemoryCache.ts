import { Cache } from '../core/Cache';

export class InMemoryCache implements Cache {
  private cache: Map<string, { value: string; expiresAt?: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.cache.set(key, { value: serialized, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}
