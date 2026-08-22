import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../shared/config/app-config.service';

const TOKEN_TTL_HOURS = 48;

/**
 * Stateless, HMAC-signed email-verification token: `<accountId>.<expiresAtMs>.<signature>`.
 * No dedicated DB table for this — data-model.md defines no such entity, and a signed token
 * lets VerifyEmailUseCase validate without a round trip beyond the final Account update.
 */
@Injectable()
export class EmailVerificationToken {
  constructor(private readonly config: AppConfigService) {}

  issue(accountId: string): string {
    const expiresAtMs = Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000;
    const payload = `${accountId}.${expiresAtMs}`;
    const signature = this.sign(payload);
    return `${payload}.${signature}`;
  }

  verify(token: string): { accountId: string } | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [accountId, expiresAtMsRaw, signature] = parts;
    const payload = `${accountId}.${expiresAtMsRaw}`;
    const expected = this.sign(payload);

    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return null;
    }

    const expiresAtMs = Number(expiresAtMsRaw);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
      return null;
    }

    return { accountId };
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.config.emailVerificationSecret).update(payload).digest('hex');
  }
}
