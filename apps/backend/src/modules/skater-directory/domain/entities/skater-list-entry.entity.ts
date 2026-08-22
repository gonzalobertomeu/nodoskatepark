/**
 * One row of the staff-facing listing (User Story 1, FR-002). `nombre`/`apellido` are read-only
 * display fields read directly from the shared `accounts` row (research.md #2) — owned by
 * 004-skater-onboarding's `skater-profile` module, never written here.
 */
export interface SkaterListEntry {
  accountId: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  fotoPath: string | null;
  status: 'active' | 'deactivated';
}
