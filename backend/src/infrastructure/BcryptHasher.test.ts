import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BcryptHasher } from '../infrastructure/BcryptHasher';

describe('BcryptHasher', () => {
  let hasher: BcryptHasher;

  beforeEach(() => {
    hasher = new BcryptHasher();
  });

  describe('hash', () => {
    it('should hash a plain text password', async () => {
      const plain = 'password123';
      const hashed = await hasher.hash(plain);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(plain);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const plain = 'password123';
      const hash1 = await hasher.hash(plain);
      const hash2 = await hasher.hash(plain);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const plain = '';
      const hashed = await hasher.hash(plain);

      expect(hashed).toBeDefined();
      expect(hashed.length).toBeGreaterThan(0);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const plain = 'password123';
      const hashed = await hasher.hash(plain);
      const result = await hasher.compare(plain, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const plain = 'password123';
      const wrong = 'wrongpassword';
      const hashed = await hasher.hash(plain);
      const result = await hasher.compare(wrong, hashed);

      expect(result).toBe(false);
    });

    it('should handle empty string comparison', async () => {
      const plain = '';
      const hashed = await hasher.hash(plain);
      const result = await hasher.compare(plain, hashed);

      expect(result).toBe(true);
    });

    it('should be case sensitive', async () => {
      const plain = 'Password123';
      const hashed = await hasher.hash(plain);
      const result = await hasher.compare('password123', hashed);

      expect(result).toBe(false);
    });
  });
});
