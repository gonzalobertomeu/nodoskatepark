import { Inject, Injectable } from '@nestjs/common';
import type { StaffListEntry } from '../../domain/entities';
import { StaffDirectoryRepository } from '../../domain/ports/staff-directory.repository';

/**
 * User Story 1 (FR-001, FR-002, FR-003, FR-005): every instructor/administrador account.
 * User Story 2 (FR-006): an optional `q` narrows the result by name or email.
 */
@Injectable()
export class ListStaffUseCase {
  constructor(
    @Inject(StaffDirectoryRepository) private readonly directory: StaffDirectoryRepository,
  ) {}

  async execute(q?: string): Promise<StaffListEntry[]> {
    return this.directory.search(q);
  }
}
