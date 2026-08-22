export interface AppendHealthAuditInput {
  skaterAccountId: string;
  editedByAccountId: string;
}

/**
 * Appends one audit row per health-conditions edit (FR-014). Append-only — never read back
 * through this feature's endpoints (Clarifications: backend-only, no UI history view).
 */
export abstract class HealthAuditRepository {
  abstract append(input: AppendHealthAuditInput): Promise<void>;
}
