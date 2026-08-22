import { Injectable, Logger } from '@nestjs/common';

export type SecurityEvent =
  | 'login_success'
  | 'login_failure'
  | 'login_locked_out'
  | 'account_locked'
  | 'google_login_success'
  | 'password_reset_requested'
  | 'password_reset_confirmed'
  | 'account_registered';

/**
 * Structured (JSON) logging for every auth security event, kept out of domain/application logic
 * proper — accountId only, never email/password, so logs stay safe to ship to a log aggregator.
 */
@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger('SecurityEvent');

  log(event: SecurityEvent, context: Record<string, string | number | undefined> = {}): void {
    this.logger.log(JSON.stringify({ event, ...context }));
  }
}
