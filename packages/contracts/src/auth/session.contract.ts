import { z } from 'zod';

/**
 * GET /auth/session — see specs/001-user-login-sso/contracts/auth-endpoints.md
 */
export const accountRoleSchema = z.enum(['skater', 'instructor', 'administrador']);

export type AccountRole = z.infer<typeof accountRoleSchema>;

/**
 * `email` is plain `z.string()` and not `.email()` on purpose: the value is produced by the server
 * from an already-validated account, so a format check here would turn a correct-but-unexpected
 * value into an unhandled ZodError on the client. Same reasoning as skater-profile's contract.
 *
 * 006-role-based-bottom-nav consumes it for the skater's "Configuración" destination, which must
 * show the account's own data (FR-018a) — see specs/006-role-based-bottom-nav/contracts.
 */
export const sessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(true), role: accountRoleSchema, email: z.string() }),
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
