import { Injectable, Logger } from '@nestjs/common';
import type { PasswordResetEmail, VerificationEmail } from '../../domain/ports/email-sender';
import { EmailSender } from '../../domain/ports/email-sender';

export interface CapturedEmail {
  to: string;
  kind: 'password-reset' | 'email-verification';
  url: string;
  sentAt: Date;
}

/**
 * Dev/test EmailSender: captures outgoing emails in memory instead of sending them, so
 * quickstart.md's scenarios (and integration tests) can retrieve the reset/verification token
 * without a real mailbox. Never wired in production (see EMAIL_ADAPTER in app-config.service.ts).
 */
@Injectable()
export class DevCaptureEmailSender extends EmailSender {
  private readonly logger = new Logger('DevCaptureEmailSender');
  private readonly captured: CapturedEmail[] = [];

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.capture({ to: email.to, kind: 'password-reset', url: email.resetUrl, sentAt: new Date() });
  }

  async sendEmailVerification(email: VerificationEmail): Promise<void> {
    this.capture({
      to: email.to,
      kind: 'email-verification',
      url: email.verificationUrl,
      sentAt: new Date(),
    });
  }

  private capture(entry: CapturedEmail): void {
    this.captured.push(entry);
    this.logger.log(`[dev-capture] ${entry.kind} -> ${entry.to}: ${entry.url}`);
  }

  /** Test/dev-only accessor — not part of the EmailSender port. */
  getCapturedEmails(): readonly CapturedEmail[] {
    return this.captured;
  }

  latestFor(to: string, kind: CapturedEmail['kind']): CapturedEmail | undefined {
    return [...this.captured].reverse().find((e) => e.to === to && e.kind === kind);
  }
}
