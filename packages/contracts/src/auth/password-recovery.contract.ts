import { z } from 'zod';

/**
 * POST /auth/password-reset/request — see specs/001-user-login-sso/contracts/auth-endpoints.md
 */
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetRequest = z.infer<typeof requestPasswordResetSchema>;

export const REQUEST_PASSWORD_RESET_ROUTE = {
  method: 'POST',
  path: '/auth/password-reset/request',
} as const;

/**
 * POST /auth/password-reset/confirm
 */
export const confirmPasswordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ConfirmPasswordResetRequest = z.infer<typeof confirmPasswordResetSchema>;

export const CONFIRM_PASSWORD_RESET_ROUTE = {
  method: 'POST',
  path: '/auth/password-reset/confirm',
} as const;
