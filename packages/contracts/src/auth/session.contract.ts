import { z } from 'zod';

/**
 * GET /auth/session — see specs/001-user-login-sso/contracts/auth-endpoints.md
 */
export const accountRoleSchema = z.enum(['skater', 'instructor', 'administrador']);

export type AccountRole = z.infer<typeof accountRoleSchema>;

export const sessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(true), role: accountRoleSchema }),
  z.object({ authenticated: z.literal(false) }),
]);

export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const SESSION_ROUTE = {
  method: 'GET',
  path: '/auth/session',
} as const;

/**
 * POST /auth/logout
 */
export const logoutResponseSchema = z.object({
  status: z.literal('ok'),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

export const LOGOUT_ROUTE = {
  method: 'POST',
  path: '/auth/logout',
} as const;
