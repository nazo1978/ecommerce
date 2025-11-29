import { z } from 'zod';

export const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  twoFactorEnabled: z.boolean().optional(),
});

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp: z.string().length(6).optional(),
});

export const RefreshTokenRequest = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterRequestDto = z.infer<typeof RegisterRequest>;
export type LoginRequestDto = z.infer<typeof LoginRequest>;
export type RefreshTokenRequestDto = z.infer<typeof RefreshTokenRequest>;
