import { Inject, Injectable } from '@nestjs/common';
import type { SearchSkatersResult } from '../../domain/ports/skater-directory.repository';
import { SkaterDirectoryRepository } from '../../domain/ports/skater-directory.repository';

export interface ListSkatersInput {
  q?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 50;

/** User Story 1: search/filter by nombre, apellido, or apodo (FR-001, FR-002, FR-003). */
@Injectable()
export class ListSkatersUseCase {
  constructor(
    @Inject(SkaterDirectoryRepository) private readonly directory: SkaterDirectoryRepository,
  ) {}

  async execute(input: ListSkatersInput): Promise<SearchSkatersResult> {
    return this.directory.search({
      q: input.q,
      page: input.page && input.page > 0 ? input.page : 1,
      pageSize: input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
    });
  }
}
