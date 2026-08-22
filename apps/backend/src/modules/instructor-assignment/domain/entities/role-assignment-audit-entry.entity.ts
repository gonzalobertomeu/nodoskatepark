export type RoleAssignmentMethod = 'existing_user' | 'email_invite';

export interface RoleAssignmentAuditEntry {
  id: string;
  adminAccountId: string;
  targetAccountId: string | null;
  targetEmail: string;
  method: RoleAssignmentMethod;
  createdAt: Date;
}
