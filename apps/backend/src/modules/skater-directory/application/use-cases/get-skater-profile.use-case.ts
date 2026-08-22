import { Inject, Injectable } from '@nestjs/common';
import type { SkaterFullProfile } from '../../domain/entities/skater-full-profile.entity';
import { LastCheckInReader } from '../../domain/ports/last-check-in-reader';
import { SkaterDirectoryRepository } from '../../domain/ports/skater-directory.repository';

/** User Story 2: full profile, including explicit empty-state fields (FR-005–FR-008, FR-015). */
@Injectable()
export class GetSkaterProfileUseCase {
  constructor(
    @Inject(SkaterDirectoryRepository) private readonly directory: SkaterDirectoryRepository,
    @Inject(LastCheckInReader) private readonly lastCheckIn: LastCheckInReader,
  ) {}

  async execute(accountId: string): Promise<SkaterFullProfile | null> {
    const profile = await this.directory.findFullProfile(accountId);
    if (!profile) {
      return null;
    }
    const ultimoIngreso = await this.lastCheckIn.findLastCheckInAt(accountId);
    return { ...profile, ultimoIngreso };
  }
}
