import { Inject, Injectable } from '@nestjs/common';
import type { Account } from '../../domain/entities/account.entity';
import type { AccountRepository as AccountRepositoryPort } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';
import type { SessionRepository as SessionRepositoryPort } from '../../domain/ports/session.repository';
import { SessionRepository } from '../../domain/ports/session.repository';

export interface ValidatedSession {
  accountId: string;
  role: Account['role'];
  /** Carried through for GET /auth/session so the authenticated app can show the account's own
   *  data without a second round trip (006-role-based-bottom-nav, FR-018a). The Account is
   *  already loaded here to re-check status, so this costs no extra query. */
  email: string;
}

/**
 * Resolves a raw session id into the authenticated account, re-checking Account.status on
 * every call (FR-016) so a deactivated account or revoked/expired session is rejected
 * immediately. Returns null rather than throwing — "no valid session" is an expected state for
 * both the session guard and GET /auth/session, not an error.
 */
@Injectable()
export class ValidateSessionUseCase {
  constructor(
    @Inject(SessionRepository) private readonly sessions: SessionRepositoryPort,
    @Inject(AccountRepository) private readonly accounts: AccountRepositoryPort,
  ) {}

  async execute(sessionId: string): Promise<ValidatedSession | null> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const account = await this.accounts.findById(session.accountId);
    if (!account || account.status !== 'active') {
      return null;
    }

    return { accountId: account.id, role: account.role, email: account.email };
  }
}
