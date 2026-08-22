import { Inject, Injectable } from '@nestjs/common';
import type { InstructorInvitation } from '../../domain/entities';
import { InstructorInvitationRepository } from '../../domain/ports/instructor-invitation.repository';

/** User Story 3 (FR-011): only `status: "pending"` invitations — not a full history. */
@Injectable()
export class ListPendingInstructorInvitationsUseCase {
  constructor(
    @Inject(InstructorInvitationRepository)
    private readonly invitations: InstructorInvitationRepository,
  ) {}

  async execute(): Promise<InstructorInvitation[]> {
    return this.invitations.listPending();
  }
}
