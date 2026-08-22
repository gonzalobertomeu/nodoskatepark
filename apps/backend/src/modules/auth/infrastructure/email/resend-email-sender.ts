import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import type { PasswordResetEmail, VerificationEmail } from '../../domain/ports/email-sender';
import { EmailSender } from '../../domain/ports/email-sender';

/**
 * Resend (resend.com) is the monorepo's sole email delivery provider (Constitution VIII) —
 * every category of outbound transactional email (notifications, verification, password
 * reset) goes through this adapter. Never referenced outside this file: `domain`/`application`
 * code depends only on the `EmailSender` port.
 */
@Injectable()
export class ResendEmailSender extends EmailSender {
  private readonly logger = new Logger('ResendEmailSender');
  private client: Resend | undefined;

  constructor(private readonly config: AppConfigService) {
    super();
  }

  /**
   * Built lazily, not in the constructor: NestJS instantiates every registered provider
   * regardless of which one EmailModule's factory ultimately selects, and the Resend SDK
   * throws immediately on an empty API key — so an eager `new Resend(...)` here would crash
   * app boot even when EMAIL_ADAPTER=dev (the default, no key required) and this adapter is
   * never actually used.
   */
  private get resend(): Resend {
    if (!this.client) {
      if (!this.config.resend.apiKey) {
        throw new Error('RESEND_API_KEY is not set — required when EMAIL_ADAPTER=resend.');
      }
      this.client = new Resend(this.config.resend.apiKey);
    }
    return this.client;
  }

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    await this.send(
      email.to,
      'Recuperá tu contraseña — NodoSkatepark',
      `Para restablecer tu contraseña, visitá: ${email.resetUrl}`,
    );
    this.logger.log(`Password reset email sent to ${email.to}`);
  }

  async sendEmailVerification(email: VerificationEmail): Promise<void> {
    await this.send(
      email.to,
      'Verificá tu email — NodoSkatepark',
      `Para verificar tu cuenta, visitá: ${email.verificationUrl}`,
    );
    this.logger.log(`Verification email sent to ${email.to}`);
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.config.resend.from,
      to,
      subject,
      text,
    });
    if (error) {
      throw new Error(`Resend delivery failed: ${error.message}`);
    }
  }
}
