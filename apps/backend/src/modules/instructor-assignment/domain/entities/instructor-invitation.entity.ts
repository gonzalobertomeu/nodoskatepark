export type InstructorInvitationStatus = 'pending' | 'cancelled' | 'resolved';

export interface InstructorInvitation {
  id: string;
  email: string;
  createdByAdminId: string;
  status: InstructorInvitationStatus;
  createdAt: Date;
  resolvedAccountId: string | null;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
}
