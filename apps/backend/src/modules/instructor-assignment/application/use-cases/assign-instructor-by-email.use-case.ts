import { Inject, Injectable } from '@nestjs/common';
import { AccountLookup } from '../../domain/ports/account-lookup';
import { InstructorInvitationRepository } from '../../domain/ports/instructor-invitation.repository';
import { InstructorAssignmentLoggerService } from '../../infrastructure/http/instructor-assignment-logger.service';
import { PromoteExistingUserToInstructorUseCase } from './promote-existing-user-to-instructor.use-case';

export type AssignInstructorByEmailResult =
  | { status: 'ok'; outcome: 'invited' | 'promoted_existing' }
  | {
      status: 'no_op';
      reason: 'already_instructor' | 'already_administrador' | 'invitation_already_pending';
    };

/**
 * User Story 2 (FR-004, FR-009, FR-010): if the email already belongs to an account, promotes it
 * directly (equivalent to `PromoteExistingUserToInstructor`, FR-010 — same effect, different
 * input method). Otherwise reserves the role via a pending `InstructorInvitation`, rejecting a
 * duplicate pending invite for the same email (FR-009) as a no_op, not an error.
 */
@Injectable()
export class AssignInstructorByEmailUseCase {
  constructor(
    @Inject(AccountLookup) private readonly accountLookup: AccountLookup,
    @Inject(InstructorInvitationRepository)
    private readonly invitations: InstructorInvitationRepository,
    private readonly promoteExistingUser: PromoteExistingUserToInstructorUseCase,
    private readonly logger: InstructorAssignmentLoggerService,
  ) {}

  async execute(email: string, adminAccountId: string): Promise<AssignInstructorByEmailResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const existingAccount = await this.accountLookup.findByEmail(normalizedEmail);
    if (existingAccount) {
      const result = await this.promoteExistingUser.execute(
        existingAccount.accountId,
        adminAccountId,
      );
      if (result.status === 'no_op') {
        return result;
      }
      return { status: 'ok', outcome: 'promoted_existing' };
    }

    const pending = await this.invitations.findPendingByEmail(normalizedEmail);
    if (pending) {
      return { status: 'no_op', reason: 'invitation_already_pending' };
    }

    await this.invitations.create(normalizedEmail, adminAccountId);
    this.logger.log('instructor_invited', { email: normalizedEmail, adminAccountId });
    return { status: 'ok', outcome: 'invited' };
  }
}
