/**
 * GET /auth/google and GET /auth/google/callback — see
 * specs/001-user-login-sso/contracts/auth-endpoints.md
 *
 * Both are browser navigations (not API calls consumed via a typed JSON client), so this
 * contract only fixes the routes and the callback's outcome query flags the frontend maps to
 * copy — there is no request/response body schema to validate.
 */
export const GOOGLE_START_ROUTE = {
  method: 'GET',
  path: '/auth/google',
} as const;

export const GOOGLE_CALLBACK_ROUTE = {
  method: 'GET',
  path: '/auth/google/callback',
} as const;

export const GoogleCallbackOutcome = {
  Cancelled: 'cancelled',
  AccountUnavailable: 'account_unavailable',
} as const;

export type GoogleCallbackOutcome =
  (typeof GoogleCallbackOutcome)[keyof typeof GoogleCallbackOutcome];

/** Query param the callback redirect uses to signal a non-success outcome to the frontend. */
export const GOOGLE_CALLBACK_OUTCOME_QUERY_PARAM = 'auth_outcome';
