import {
  type AuthErrorBody,
  CONFIRM_PASSWORD_RESET_ROUTE,
  type ConfirmPasswordResetRequest,
  GOOGLE_START_ROUTE,
  LOGIN_ROUTE,
  type LoginRequest,
  type LoginResponse,
  loginResponseSchema,
  type OkResponse,
  okResponseSchema,
  REGISTER_ROUTE,
  REQUEST_PASSWORD_RESET_ROUTE,
  type RegisterRequest,
  type RegisterResponse,
  type RequestPasswordResetRequest,
  registerResponseSchema,
  SESSION_ROUTE,
  type SessionResponse,
  sessionResponseSchema,
  VERIFY_EMAIL_ROUTE,
} from '@nodoskatepark/contracts';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: AuthErrorBody,
  ) {
    super(body.message);
  }
}

async function postJson<TResponse>(
  path: string,
  body: unknown,
  parseResponse: (raw: unknown) => TResponse,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AuthApiError(response.status, raw as AuthErrorBody);
  }

  return parseResponse(raw);
}

async function getJson<TResponse>(
  path: string,
  parseResponse: (raw: unknown) => TResponse,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AuthApiError(response.status, raw as AuthErrorBody);
  }

  return parseResponse(raw);
}

export const authClient = {
  session(): Promise<SessionResponse> {
    return getJson(SESSION_ROUTE.path, (raw) => sessionResponseSchema.parse(raw));
  },

  login(input: LoginRequest): Promise<LoginResponse> {
    return postJson(LOGIN_ROUTE.path, input, (raw) => loginResponseSchema.parse(raw));
  },

  register(input: RegisterRequest): Promise<RegisterResponse> {
    return postJson(REGISTER_ROUTE.path, input, (raw) => registerResponseSchema.parse(raw));
  },

  requestPasswordReset(input: RequestPasswordResetRequest): Promise<OkResponse> {
    return postJson(REQUEST_PASSWORD_RESET_ROUTE.path, input, (raw) => okResponseSchema.parse(raw));
  },

  confirmPasswordReset(input: ConfirmPasswordResetRequest): Promise<OkResponse> {
    return postJson(CONFIRM_PASSWORD_RESET_ROUTE.path, input, (raw) => okResponseSchema.parse(raw));
  },

  confirmEmailVerification(token: string): Promise<OkResponse> {
    return postJson(VERIFY_EMAIL_ROUTE.path, { token }, (raw) => okResponseSchema.parse(raw));
  },

  googleLoginUrl(): string {
    return `${API_BASE_URL}${GOOGLE_START_ROUTE.path}`;
  },
};
