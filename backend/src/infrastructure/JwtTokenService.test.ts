import { describe, it, expect, beforeEach } from 'vitest';
import { JwtTokenService } from '../infrastructure/JwtTokenService';

describe('JwtTokenService', () => {
  let tokenService: JwtTokenService;

  beforeEach(() => {
    tokenService = new JwtTokenService();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const payload = {
        sub: 'user-123',
        roles: ['CUSTOMER'],
        permissions: ['PRODUCT_VIEW', 'CART_USE'],
      };

      const tokens = await tokenService.generateTokens(payload);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid JWT tokens', async () => {
      const payload = {
        sub: 'user-123',
        roles: ['ADMIN'],
        permissions: ['ADMIN_READ', 'ADMIN_WRITE'],
      };

      const tokens = await tokenService.generateTokens(payload);
      
      // JWT tokens should have 3 parts separated by dots
      expect(tokens.accessToken.split('.')).toHaveLength(3);
      expect(tokens.refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const payload = {
        sub: 'user-123',
        roles: ['CUSTOMER'],
        permissions: ['PRODUCT_VIEW'],
      };

      const tokens = await tokenService.generateTokens(payload);
      const verified = await tokenService.verifyAccessToken(tokens.accessToken);

      expect(verified).toBeDefined();
      expect(verified.sub).toBe(payload.sub);
      expect(verified.roles).toEqual(payload.roles);
      expect(verified.permissions).toEqual(payload.permissions);
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(
        tokenService.verifyAccessToken(invalidToken)
      ).rejects.toThrow();
    });

    it('should reject malformed token', async () => {
      await expect(
        tokenService.verifyAccessToken('not-a-token')
      ).rejects.toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const payload = {
        sub: 'user-123',
        roles: ['SELLER'],
        permissions: ['PRODUCT_CREATE'],
      };

      const tokens = await tokenService.generateTokens(payload);
      const verified = await tokenService.verifyRefreshToken(tokens.refreshToken);

      expect(verified).toBeDefined();
      expect(verified.sub).toBe(payload.sub);
    });

    it('should reject invalid refresh token', async () => {
      await expect(
        tokenService.verifyRefreshToken('invalid.refresh.token')
      ).rejects.toThrow();
    });
  });

  describe('token expiration', () => {
    it('should include expiration in token payload', async () => {
      const payload = {
        sub: 'user-123',
        roles: ['CUSTOMER'],
        permissions: ['PRODUCT_VIEW'],
      };

      const tokens = await tokenService.generateTokens(payload);
      const verified = await tokenService.verifyAccessToken(tokens.accessToken);

      expect(verified.exp).toBeDefined();
      expect(verified.iat).toBeDefined();
      expect(verified.exp).toBeGreaterThan(verified.iat);
    });
  });
});
