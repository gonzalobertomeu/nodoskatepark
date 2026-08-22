import type { RoleAssignmentMethod } from '../entities';

export interface RoleAssignmentAuditEntryInput {
  adminAccountId: string;
  targetAccountId: string | null;
  targetEmail: string;
  method: RoleAssignmentMethod;
}

export abstract class RoleAssignmentAuditRepository {
  abstract append(entry: RoleAssignmentAuditEntryInput): Promise<void>;
}
