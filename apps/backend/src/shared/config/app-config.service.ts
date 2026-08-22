import { Injectable } from '@nestjs/common';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

@Injectable()
export class AppConfigService {
  readonly port = Number(process.env.PORT ?? '3000');
  readonly databaseUrl = requireEnv('DATABASE_URL');
  readonly frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4321';

  readonly session = {
    cookieName: process.env.SESSION_COOKIE_NAME ?? 'nsk_session',
    ttlHours: Number(process.env.SESSION_TTL_HOURS ?? '24'),
  };

  readonly google = {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
  };

  /** Resend (resend.com) — the monorepo's sole email delivery provider (Constitution VIII). */
  readonly resend = {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'NodoSkatepark <no-reply@nodoskatepark.com>',
  };

  /** "dev" captures emails in-memory for quickstart.md/tests instead of sending via Resend. */
  readonly emailAdapter: 'resend' | 'dev' =
    process.env.EMAIL_ADAPTER === 'resend' ? 'resend' : 'dev';

  /** HMAC secret for the stateless email-verification token (FR-013) — no dedicated DB table. */
  readonly emailVerificationSecret =
    process.env.EMAIL_VERIFICATION_SECRET ?? 'dev-only-insecure-secret';

  /** Local-disk skater photo storage (002-staff-skater-directory research.md #1). */
  readonly skaterPhotoStorageDir = process.env.SKATER_PHOTO_STORAGE_DIR ?? '/data/skater-photos';
}
