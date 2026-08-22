import { Inject, Injectable } from '@nestjs/common';
import { InstructorInvitationRepository } from '../../domain/ports/instructor-invitation.repository';
import { InstructorAssignmentLoggerService } from '../../infrastructure/http/instructor-assignment-logger.service';

/** Mapped by the controller to a 404 `not_found` response. */
export class InvitationNotCancellableError extends Error {
  constructor(invitationId: string) {
    super(`Invitation not found or not pending: ${invitationId}`);
  }
}

/**
 * User Story 3: only a `pending` invitation may be cancelled (data-model.md) — an already
 * cancelled/resolved invitation, or one that never existed, is reported as `not_found`.
 */
@Injectable()
export class CancelInstructorInvitationUseCase {
  constructor(
    @Inject(InstructorInvitationRepository)
    private readonly invitations: InstructorInvitationRepository,
    private readonly logger: InstructorAssignmentLoggerService,
  ) {}

  async execute(invitationId: string): Promise<void> {
    const invitation = await this.invitations.findById(invitationId);
    if (invitation?.status !== 'pending') {
      throw new InvitationNotCancellableError(invitationId);
    }
    await this.invitations.markCancelled(invitationId);
    this.logger.log('invitation_cancelled', { invitationId });
  }
}
