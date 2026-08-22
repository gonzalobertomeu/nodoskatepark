import { z } from 'zod';

/**
 * POST /auth/register — see specs/001-user-login-sso/contracts/auth-endpoints.md
 */
export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const registerResponseSchema = z.object({
  status: z.literal('ok'),
  emailVerificationRequired: z.literal(true),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const REGISTER_ROUTE = {
  method: 'POST',
  path: '/auth/register',
} as const;

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const VERIFY_EMAIL_ROUTE = {
  method: 'POST',
  path: '/auth/verify-email',
} as const;
