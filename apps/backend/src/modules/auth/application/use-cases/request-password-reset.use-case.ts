import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { EmailSender as EmailSenderPort } from '../../domain/ports/email-sender';
import { EmailSender } from '../../domain/ports/email-sender';
import type { PasswordResetRepository as PasswordResetRepositoryPort } from '../../domain/ports/password-reset.repository';
import { PasswordResetRepository } from '../../domain/ports/password-reset.repository';
import { SecurityLoggerService } from '../../infrastructure/http/security-logger.service';

const RESET_TOKEN_TTL_MINUTES = 30;

export interface RequestPasswordResetInput {
  email: string;
}

/**
 * User Story 3, step 1. FR-007: response is always identical whether or not the email exists —
 * this use case NEVER throws for "account not found"; it simply skips creating a request/email
 * in that case, so the controller always returns 200 { status: "ok" }.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
    @Inject(PasswordResetRepository) private readonly resetRequests: PasswordResetRepositoryPort,
    @Inject(EmailSender) private readonly emailSender: EmailSenderPort,
    private readonly config: AppConfigService,
    private readonly securityLog: SecurityLoggerService,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const account = await this.accounts.findByEmail(input.email);
    if (!account || !account.passwordHash) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    await this.resetRequests.create({
      accountId: account.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
    });

    const resetUrl = `${this.config.frontendUrl}/reset-password?token=${token}`;
    await this.emailSender.sendPasswordReset({ to: account.email, resetUrl });
    this.securityLog.log('password_reset_requested', { accountId: account.id });
  }
}
