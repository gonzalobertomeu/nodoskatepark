/**
 * The full staff-facing profile (User Story 2, FR-005). `nombre`/`apellido`/`fechaDeNacimiento`
 * and `email`/`status` are read-only display fields read directly from the shared `accounts`
 * row (research.md #2) — owned by 004's `skater-profile` module and 001's `auth` module
 * respectively, never written by skater-directory. `ultimoIngreso` comes from `LastCheckInReader`
 * and is `null` for every skater until a future check-in feature exists (FR-008).
 */
export interface SkaterFullProfile {
  accountId: string;
  nombre: string | null;
  apellido: string | null;
  fechaDeNacimiento: Date | null;
  email: string;
  apodo: string | null;
  afeccionesDeSalud: string | null;
  fotoPath: string | null;
  ultimoIngreso: Date | null;
  status: 'active' | 'deactivated';
}
