/**
 * Cross-module port (Constitution II): instructor-assignment declares this for the one write it
 * needs into auth-owned data (Account.role), implemented + exported by the auth module — auth
 * remains the sole writer of Account.role. Only ever assigns 'instructor'; this feature never
 * assigns 'administrador' or reverts to 'skater' (out of scope — spec.md Assumptions).
 */
export abstract class AccountRoleWriter {
  abstract assignInstructorRole(accountId: string): Promise<void>;
}
