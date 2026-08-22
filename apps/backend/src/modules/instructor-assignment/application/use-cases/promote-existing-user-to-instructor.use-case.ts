import { Inject, Injectable } from '@nestjs/common';
import { AccountLookup } from '../../domain/ports/account-lookup';
import { AccountRoleWriter } from '../../domain/ports/account-role-writer';
import { RoleAssignmentAuditRepository } from '../../domain/ports/role-assignment-audit.repository';
import { InstructorAssignmentLoggerService } from '../../infrastructure/http/instructor-assignment-logger.service';

export type PromoteExistingUserResult =
  | { status: 'ok' }
  | { status: 'no_op'; reason: 'already_instructor' | 'already_administrador' };

/** Domain error, mapped by the controller to a 404 `not_found` response. */
export class AccountNotFoundError extends Error {
  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
  }
}

/**
 * User Story 1 (FR-001, FR-002, FR-007, FR-008, FR-014): promotes an already-registered account
 * to instructor, or reports a no-op (never an error, research.md #3) if it's already
 * instructor/administrador.
 */
@Injectable()
export class PromoteExistingUserToInstructorUseCase {
  constructor(
    @Inject(AccountLookup) private readonly accountLookup: AccountLookup,
    @Inject(AccountRoleWriter) private readonly accountRoleWriter: AccountRoleWriter,
    @Inject(RoleAssignmentAuditRepository)
    private readonly auditRepository: RoleAssignmentAuditRepository,
    private readonly logger: InstructorAssignmentLoggerService,
  ) {}

  async execute(accountId: string, adminAccountId: string): Promise<PromoteExistingUserResult> {
    const account = await this.accountLookup.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    if (account.role === 'instructor') {
      this.logger.log('promotion_no_op', { accountId, reason: 'already_instructor' });
      return { status: 'no_op', reason: 'already_instructor' };
    }
    if (account.role === 'administrador') {
      this.logger.log('promotion_no_op', { accountId, reason: 'already_administrador' });
      return { status: 'no_op', reason: 'already_administrador' };
    }

    await this.accountRoleWriter.assignInstructorRole(accountId);
    await this.auditRepository.append({
      adminAccountId,
      targetAccountId: accountId,
      targetEmail: account.email,
      method: 'existing_user',
    });
    this.logger.log('promoted_existing_user', { accountId, adminAccountId });
    return { status: 'ok' };
  }
}
