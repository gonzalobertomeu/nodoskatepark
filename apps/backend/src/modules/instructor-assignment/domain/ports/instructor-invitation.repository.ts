import type { InstructorInvitation } from '../entities';

export abstract class InstructorInvitationRepository {
  abstract create(email: string, createdByAdminId: string): Promise<InstructorInvitation>;
  abstract findPendingByEmail(email: string): Promise<InstructorInvitation | null>;
  abstract findById(id: string): Promise<InstructorInvitation | null>;
  abstract markCancelled(id: string): Promise<void>;
  abstract markResolved(id: string, resolvedAccountId: string): Promise<void>;
  abstract listPending(): Promise<InstructorInvitation[]>;
}
