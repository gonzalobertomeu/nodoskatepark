import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthErrorCode } from '@nodoskatepark/contracts';
import { ACCOUNT_CREATED_EVENT } from '../../../../shared/events/account-created.event';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { PasswordHasher as PasswordHasherPort } from '../../domain/ports/password-hasher';
import { PasswordHasher } from '../../domain/ports/password-hasher';
import { SecurityLoggerService } from '../../infrastructure/http/security-logger.service';

export interface RegisterAccountInput {
  email: string;
  password: string;
}

/**
 * User Story 4: self-registration. FR-010 (email uniqueness — 409, no account details leaked),
 * FR-011 (role is always "skater"). FR-017: a manual registration on an email already linked to
 * a Google-only account (no password set) is rejected with a distinct error directing the user
 * to sign in with Google instead, rather than the generic "already registered" message. Email
 * verification token issuance is VerifyEmailUseCase's responsibility (verify-email.use-case.ts),
 * invoked by the controller right after this succeeds, per FR-013.
 */
@Injectable()
export class RegisterAccountUseCase {
  constructor(
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
    @Inject(PasswordHasher) private readonly hasher: PasswordHasherPort,
    private readonly securityLog: SecurityLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: RegisterAccountInput): Promise<{ accountId: string; email: string }> {
    const existing = await this.accounts.findByEmail(input.email);
    if (existing?.googleId && !existing.passwordHash) {
      throw new HttpException(
        {
          error: AuthErrorCode.GoogleAccountExists,
          message: 'Ese email ya está vinculado a una cuenta de Google. Ingresá con Google.',
        },
        HttpStatus.CONFLICT,
      );
    }
    if (existing) {
      throw new HttpException(
        {
          error: AuthErrorCode.EmailAlreadyRegistered,
          message: 'Ya existe una cuenta con ese email.',
        },
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await this.hasher.hash(input.password);
    const account = await this.accounts.create({
      email: input.email,
      passwordHash,
      googleId: null,
      role: 'skater',
      emailVerifiedAt: null,
    });

    this.securityLog.log('account_registered', { accountId: account.id });

    // Awaited (not fire-and-forget) so instructor-assignment's pending-invitation check
    // completes before this use case returns — research.md #1 of 003-instructor-role-assignment.
    await this.eventEmitter.emitAsync(ACCOUNT_CREATED_EVENT, {
      accountId: account.id,
      email: account.email,
    });

    return { accountId: account.id, email: account.email };
  }
}
