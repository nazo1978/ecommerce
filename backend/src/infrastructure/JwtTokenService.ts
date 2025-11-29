import jwt from 'jsonwebtoken';
import { TokenService, TokenPair, TokenPayload } from '../core/TokenService';
import { config } from '../config/env';

export class JwtTokenService implements TokenService {
  async generateTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }
}
