import type { SkaterFullProfile } from '../entities/skater-full-profile.entity';
import type { SkaterListEntry } from '../entities/skater-list-entry.entity';

export interface SearchSkatersInput {
  q?: string;
  page: number;
  pageSize: number;
}

export interface SearchSkatersResult {
  items: SkaterListEntry[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SaveEditableFieldsInput {
  accountId: string;
  apodo: string | null;
  afeccionesDeSalud: string | null;
}

/**
 * Owns apodo/afeccionesDeSalud/fotoPath (this module's only writable fields), and reads the full
 * display row — including nombre/apellido/fechaDeNacimiento (skater-profile) and email/status
 * (auth) — directly via the shared Prisma client for the listing/profile read paths
 * (research.md #2). accountId must resolve to a `skater`-role account; the implementation
 * filters by role so staff accounts never appear.
 */
export abstract class SkaterDirectoryRepository {
  abstract search(input: SearchSkatersInput): Promise<SearchSkatersResult>;
  abstract findFullProfile(accountId: string): Promise<SkaterFullProfile | null>;
  abstract saveEditableFields(input: SaveEditableFieldsInput): Promise<void>;
  abstract saveFotoPath(accountId: string, fotoPath: string): Promise<void>;
}
