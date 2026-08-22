import { Inject, Injectable } from '@nestjs/common';
import type { UploadedPhoto } from '../../domain/ports/photo-storage';
import { PhotoStorage } from '../../domain/ports/photo-storage';
import { SkaterDirectoryRepository } from '../../domain/ports/skater-directory.repository';
import { SkaterDirectoryLoggerService } from '../../infrastructure/http/skater-directory-logger.service';

export interface UploadSkaterPhotoInput {
  accountId: string;
  photo: UploadedPhoto;
}

/**
 * User Story 3 (FR-013). Validates before saving; an invalid upload never reaches
 * `saveFotoPath`, so the previous photo (if any) is left untouched (Edge Cases).
 */
@Injectable()
export class UploadSkaterPhotoUseCase {
  constructor(
    @Inject(PhotoStorage) private readonly photoStorage: PhotoStorage,
    @Inject(SkaterDirectoryRepository) private readonly directory: SkaterDirectoryRepository,
    private readonly logger: SkaterDirectoryLoggerService,
  ) {}

  async execute(input: UploadSkaterPhotoInput): Promise<string> {
    this.photoStorage.validate(input.photo);
    const fotoPath = await this.photoStorage.save(input.accountId, input.photo);
    await this.directory.saveFotoPath(input.accountId, fotoPath);
    this.logger.log('photo_uploaded', { accountId: input.accountId });
    return fotoPath;
  }
}
