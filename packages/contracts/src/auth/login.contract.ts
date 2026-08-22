import { z } from 'zod';

/**
 * POST /auth/login — see specs/001-user-login-sso/contracts/auth-endpoints.md
 */
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  status: z.literal('ok'),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const LOGIN_ROUTE = {
  method: 'POST',
  path: '/auth/login',
} as const;
