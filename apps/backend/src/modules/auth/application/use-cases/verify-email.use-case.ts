import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuthErrorCode } from '@nodoskatepark/contracts';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { EmailSender as EmailSenderPort } from '../../domain/ports/email-sender';
import { EmailSender } from '../../domain/ports/email-sender';
import { EmailVerificationToken } from '../../infrastructure/auth/email-verification-token';

/**
 * User Story 4, verification step. FR-013: gates first login for password-based signups until
 * this succeeds. Google-originated accounts never need this (created with emailVerifiedAt set).
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
    @Inject(EmailSender) private readonly emailSender: EmailSenderPort,
    private readonly tokens: EmailVerificationToken,
    private readonly config: AppConfigService,
  ) {}

  async sendVerification(accountId: string, email: string): Promise<void> {
    const token = this.tokens.issue(accountId);
    const verificationUrl = `${this.config.frontendUrl}/verify-email?token=${token}`;
    await this.emailSender.sendEmailVerification({ to: email, verificationUrl });
  }

  async execute(token: string): Promise<void> {
    const verified = this.tokens.verify(token);
    if (!verified) {
      throw new HttpException(
        { error: AuthErrorCode.InvalidOrExpiredToken, message: 'El enlace no es válido o expiró.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const account = await this.accounts.findById(verified.accountId);
    if (!account) {
      throw new HttpException(
        { error: AuthErrorCode.InvalidOrExpiredToken, message: 'El enlace no es válido o expiró.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!account.emailVerifiedAt) {
      await this.accounts.save({ ...account, emailVerifiedAt: new Date() });
    }
  }
}
