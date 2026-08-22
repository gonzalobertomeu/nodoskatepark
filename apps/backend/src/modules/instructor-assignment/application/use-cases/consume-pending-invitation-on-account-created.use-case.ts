import { Inject, Injectable } from '@nestjs/common';
import { AccountRoleWriter } from '../../domain/ports/account-role-writer';
import { InstructorInvitationRepository } from '../../domain/ports/instructor-invitation.repository';
import { RoleAssignmentAuditRepository } from '../../domain/ports/role-assignment-audit.repository';
import { InstructorAssignmentLoggerService } from '../../infrastructure/http/instructor-assignment-logger.service';

/**
 * User Story 2 (FR-004, FR-014, data-model.md): runs synchronously on every new-account creation
 * (research.md #1's awaited `account.created` event). If a pending invitation matches the new
 * account's email, assigns the instructor role, marks the invitation resolved, and — only now,
 * not at invitation-creation time — appends the audit row with `method: "email_invite"`.
 */
@Injectable()
export class ConsumePendingInvitationOnAccountCreatedUseCase {
  constructor(
    @Inject(InstructorInvitationRepository)
    private readonly invitations: InstructorInvitationRepository,
    @Inject(AccountRoleWriter) private readonly accountRoleWriter: AccountRoleWriter,
    @Inject(RoleAssignmentAuditRepository)
    private readonly auditRepository: RoleAssignmentAuditRepository,
    private readonly logger: InstructorAssignmentLoggerService,
  ) {}

  async execute(accountId: string, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const invitation = await this.invitations.findPendingByEmail(normalizedEmail);
    if (!invitation) {
      return;
    }

    await this.accountRoleWriter.assignInstructorRole(accountId);
    await this.invitations.markResolved(invitation.id, accountId);
    await this.auditRepository.append({
      adminAccountId: invitation.createdByAdminId,
      targetAccountId: accountId,
      targetEmail: normalizedEmail,
      method: 'email_invite',
    });
    this.logger.log('invitation_resolved', {
      invitationId: invitation.id,
      accountId,
      email: normalizedEmail,
    });
  }
}
