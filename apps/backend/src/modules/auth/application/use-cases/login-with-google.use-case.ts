import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthErrorCode } from '@nodoskatepark/contracts';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import { ACCOUNT_CREATED_EVENT } from '../../../../shared/events/account-created.event';
import type { Account } from '../../domain/entities/account.entity';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { GoogleIdentity } from '../../domain/ports/google-identity-verifier';
import type { SessionRepository as SessionRepositoryPort } from '../../domain/ports/session.repository';
import { SessionRepository } from '../../domain/ports/session.repository';
import { SecurityLoggerService } from '../../infrastructure/http/security-logger.service';

export interface LoginWithGoogleResult {
  sessionId: string;
  role: Account['role'];
}

function accountUnavailable(): never {
  throw new HttpException(
    { error: AuthErrorCode.AccountUnavailable, message: 'Esta cuenta no está disponible.' },
    HttpStatus.FORBIDDEN,
  );
}

/**
 * User Story 2: Google SSO. FR-005 (equivalent treatment to credential login on success),
 * FR-012 (create the account on first-ever Google sign-in), FR-017 (auto-link by email to an
 * existing password-based account instead of creating a duplicate), FR-016 (deactivated
 * accounts rejected regardless of method).
 */
@Injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
    @Inject(SessionRepository) private readonly sessions: SessionRepositoryPort,
    private readonly config: AppConfigService,
    private readonly securityLog: SecurityLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(identity: GoogleIdentity): Promise<LoginWithGoogleResult> {
    const account = await this.resolveAccount(identity);

    if (account.status !== 'active') {
      this.securityLog.log('login_failure', {
        accountId: account.id,
        reason: 'deactivated',
        method: 'google',
      });
      accountUnavailable();
    }

    const session = await this.sessions.create({
      accountId: account.id,
      authMethod: 'google',
      expiresAt: new Date(Date.now() + this.config.session.ttlHours * 60 * 60 * 1000),
    });

    this.securityLog.log('google_login_success', { accountId: account.id });

    return { sessionId: session.id, role: account.role };
  }

  private async resolveAccount(identity: GoogleIdentity): Promise<Account> {
    const byGoogleId = await this.accounts.findByGoogleId(identity.googleId);
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.accounts.findByEmail(identity.email);
    if (byEmail) {
      // FR-017: auto-link this Google identity to the existing password-based account.
      return this.accounts.save({ ...byEmail, googleId: identity.googleId });
    }

    // FR-012: first-ever Google sign-in for this email — create the account. Google-originated
    // accounts are considered email-verified automatically (spec.md Assumptions).
    const account = await this.accounts.create({
      email: identity.email,
      passwordHash: null,
      googleId: identity.googleId,
      role: 'skater',
      emailVerifiedAt: new Date(),
    });

    // Awaited (not fire-and-forget), only on this new-account branch — not the auto-link or
    // existing-account branches above — research.md #1 of 003-instructor-role-assignment.
    await this.eventEmitter.emitAsync(ACCOUNT_CREATED_EVENT, {
      accountId: account.id,
      email: account.email,
    });

    return account;
  }
}
