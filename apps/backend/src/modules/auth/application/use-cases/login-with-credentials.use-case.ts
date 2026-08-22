import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuthErrorCode } from '@nodoskatepark/contracts';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import type { Account } from '../../domain/entities/account.entity';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { PasswordHasher as PasswordHasherPort } from '../../domain/ports/password-hasher';
import { PasswordHasher } from '../../domain/ports/password-hasher';
import type { SessionRepository as SessionRepositoryPort } from '../../domain/ports/session.repository';
import { SessionRepository } from '../../domain/ports/session.repository';
import { LockoutPolicy } from '../../domain/services/lockout-policy';
import { SecurityLoggerService } from '../../infrastructure/http/security-logger.service';

export interface LoginWithCredentialsInput {
  email: string;
  password: string;
}

export interface LoginWithCredentialsResult {
  sessionId: string;
  role: Account['role'];
}

function invalidCredentials(): never {
  throw new HttpException(
    { error: AuthErrorCode.InvalidCredentials, message: 'Email o contraseña incorrectos.' },
    HttpStatus.UNAUTHORIZED,
  );
}

function accountUnavailable(): never {
  throw new HttpException(
    { error: AuthErrorCode.AccountUnavailable, message: 'Esta cuenta no está disponible.' },
    HttpStatus.FORBIDDEN,
  );
}

/**
 * User Story 1: credential login. FR-003 (identical response for wrong password / unknown
 * email), FR-015 (lockout policy), FR-016 (deactivated accounts rejected regardless of
 * credential correctness), FR-013 (unverified self-registered accounts can't log in yet —
 * surfaced as the same generic account_unavailable as deactivated/locked, since the contract
 * defines no separate error code and none of these states should be distinguishable to an
 * unauthenticated caller).
 */
@Injectable()
export class LoginWithCredentialsUseCase {
  private readonly lockoutPolicy = new LockoutPolicy();

  constructor(
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
    @Inject(SessionRepository) private readonly sessions: SessionRepositoryPort,
    @Inject(PasswordHasher) private readonly hasher: PasswordHasherPort,
    private readonly config: AppConfigService,
    private readonly securityLog: SecurityLoggerService,
  ) {}

  async execute(input: LoginWithCredentialsInput): Promise<LoginWithCredentialsResult> {
    const account = await this.accounts.findByEmail(input.email);

    if (!account || !account.passwordHash) {
      this.securityLog.log('login_failure', { reason: 'unknown_account' });
      invalidCredentials();
    }

    if (account.status !== 'active') {
      this.securityLog.log('login_failure', { accountId: account.id, reason: 'deactivated' });
      accountUnavailable();
    }

    if (this.lockoutPolicy.isLockedOut(account)) {
      this.securityLog.log('login_locked_out', { accountId: account.id });
      accountUnavailable();
    }

    if (!account.emailVerifiedAt) {
      this.securityLog.log('login_failure', { accountId: account.id, reason: 'email_unverified' });
      accountUnavailable();
    }

    const passwordMatches = await this.hasher.verify(account.passwordHash, input.password);
    if (!passwordMatches) {
      const { failedAttempts, lockedUntil } = this.lockoutPolicy.registerFailure(account);
      await this.accounts.save({ ...account, failedAttempts, lockedUntil });
      this.securityLog.log('login_failure', {
        accountId: account.id,
        reason: 'wrong_password',
        failedAttempts,
      });
      if (lockedUntil) {
        this.securityLog.log('account_locked', { accountId: account.id });
      }
      invalidCredentials();
    }

    const { failedAttempts, lockedUntil } = this.lockoutPolicy.registerSuccess();
    await this.accounts.save({ ...account, failedAttempts, lockedUntil });

    const session = await this.sessions.create({
      accountId: account.id,
      authMethod: 'password',
      expiresAt: new Date(Date.now() + this.config.session.ttlHours * 60 * 60 * 1000),
    });

    this.securityLog.log('login_success', { accountId: account.id });

    return { sessionId: session.id, role: account.role };
  }
}
