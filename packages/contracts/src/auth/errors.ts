import { z } from 'zod';

export const AuthErrorCode = {
  InvalidCredentials: 'invalid_credentials',
  AccountUnavailable: 'account_unavailable',
  EmailAlreadyRegistered: 'email_already_registered',
  GoogleAccountExists: 'google_account_exists',
  InvalidInput: 'invalid_input',
  InvalidOrExpiredToken: 'invalid_or_expired_token',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export const authErrorBodySchema = z.object({
  error: z.enum([
    AuthErrorCode.InvalidCredentials,
    AuthErrorCode.AccountUnavailable,
    AuthErrorCode.EmailAlreadyRegistered,
    AuthErrorCode.GoogleAccountExists,
    AuthErrorCode.InvalidInput,
    AuthErrorCode.InvalidOrExpiredToken,
  ]),
  message: z.string(),
});

export type AuthErrorBody = z.infer<typeof authErrorBodySchema>;

export const okResponseSchema = z.object({
  status: z.literal('ok'),
});

export type OkResponse = z.infer<typeof okResponseSchema>;
