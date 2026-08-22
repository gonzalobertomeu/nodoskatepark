import type { Account } from '../entities/account.entity';

export interface NewAccountInput {
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  role: Account['role'];
  emailVerifiedAt: Date | null;
}

export abstract class AccountRepository {
  abstract findById(id: string): Promise<Account | null>;
  /** Lookup is case-insensitive per data-model.md — callers pass the raw email as typed. */
  abstract findByEmail(email: string): Promise<Account | null>;
  abstract findByGoogleId(googleId: string): Promise<Account | null>;
  abstract create(input: NewAccountInput): Promise<Account>;
  abstract save(account: Account): Promise<Account>;
}
