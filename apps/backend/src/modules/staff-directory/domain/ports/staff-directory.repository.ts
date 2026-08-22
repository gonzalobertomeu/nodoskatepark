import type { StaffListEntry } from '../entities';

/**
 * Local port (Constitution II, research.md #2): staff-directory declares and implements this
 * itself, backed by the shared Prisma client — reading Account.nombre/apellido/email/role/status
 * (scoped to role IN ('instructor', 'administrador')) is a read of shared display/identity data,
 * not a cross-module file import.
 */
export abstract class StaffDirectoryRepository {
  abstract search(q?: string): Promise<StaffListEntry[]>;
}
