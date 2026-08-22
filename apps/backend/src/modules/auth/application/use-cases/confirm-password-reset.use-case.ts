import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuthErrorCode } from '@nodoskatepark/contracts';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { PasswordHasher as PasswordHasherPort } from '../../domain/ports/password-hasher';
import { PasswordHasher } from '../../domain/ports/password-hasher';
import type { PasswordResetRepository as PasswordResetRepositoryPort } from '../../domain/ports/password-reset.repository';
import { PasswordResetRepository } from '../../domain/ports/password-reset.repository';
import { SecurityLoggerService } from '../../infrastructure/http/security-logger.service';

export interface ConfirmPasswordResetInput {
  token: string;
  newPassword: string;
}

function invalidOrExpiredToken(): never {
  throw new HttpException(
    { error: AuthErrorCode.InvalidOrExpiredToken, message: 'El enlace no es válido o expiró.' },
    HttpStatus.BAD_REQUEST,
  );
}

/**
 * User Story 3, step 2. FR-008: a request is usable only while pending and not expired; once
 * consumed it MUST transition to "used" and never be reusable.
 */
@Injectable()
export class ConfirmPasswordResetUseCase {
  constructor(
    @Inject(PasswordResetRepository) private readonly resetRequests: PasswordResetRepositoryPort,
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
    @Inject(PasswordHasher) private readonly hasher: PasswordHasherPort,
    private readonly securityLog: SecurityLoggerService,
  ) {}

  async execute(input: ConfirmPasswordResetInput): Promise<void> {
    const request = await this.resetRequests.findByToken(input.token);
    if (!request || request.status !== 'pending' || request.expiresAt.getTime() < Date.now()) {
      invalidOrExpiredToken();
    }

    const account = await this.accounts.findById(request.accountId);
    if (!account) {
      invalidOrExpiredToken();
    }

    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.accounts.save({ ...account, passwordHash, failedAttempts: 0, lockedUntil: null });
    await this.resetRequests.markUsed(request.id);
    this.securityLog.log('password_reset_confirmed', { accountId: account.id });
  }
}
