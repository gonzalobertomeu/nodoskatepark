export interface AccountLookupResult {
  accountId: string;
  email: string;
  role: 'skater' | 'instructor' | 'administrador';
  status: 'active' | 'deactivated';
}

/**
 * Local port (Constitution II): declared AND implemented by instructor-assignment itself, via
 * the shared Prisma client — not a cross-module port implemented by auth. Reading another
 * module's display/identity data from the shared `accounts` table is not a cross-module file
 * import, so it doesn't need auth's involvement (research.md #2) — unlike AccountRoleWriter,
 * which writes auth-owned data and does need auth's own implementation.
 */
export abstract class AccountLookup {
  abstract findById(accountId: string): Promise<AccountLookupResult | null>;
  abstract findByEmail(email: string): Promise<AccountLookupResult | null>;
}
