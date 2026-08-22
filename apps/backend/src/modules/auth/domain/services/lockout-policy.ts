import type { Account } from '../entities/account.entity';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * FR-015: 5 consecutive failed attempts lock the account for 15 minutes; a successful login
 * resets both counters. Pure domain logic — no persistence, no framework types.
 */
export class LockoutPolicy {
  isLockedOut(account: Pick<Account, 'lockedUntil'>): boolean {
    return account.lockedUntil !== null && account.lockedUntil.getTime() > Date.now();
  }

  registerFailure(
    account: Pick<Account, 'failedAttempts' | 'lockedUntil'>,
  ): Pick<Account, 'failedAttempts' | 'lockedUntil'> {
    const failedAttempts = account.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : account.lockedUntil;
    return { failedAttempts, lockedUntil };
  }

  registerSuccess(): Pick<Account, 'failedAttempts' | 'lockedUntil'> {
    return { failedAttempts: 0, lockedUntil: null };
  }
}
