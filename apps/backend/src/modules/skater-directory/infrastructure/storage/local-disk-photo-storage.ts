import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import type { StoredPhoto, UploadedPhoto } from '../../domain/ports/photo-storage';
import { InvalidPhotoError, PhotoStorage } from '../../domain/ports/photo-storage';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // FR-013

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Stores photos on local disk under a named Docker volume (research.md #1) — never in Postgres,
 * never served as a public/static path (the controller gates every read behind
 * CurrentSessionResolver, same as every other skater-directory endpoint).
 */
@Injectable()
export class LocalDiskPhotoStorage extends PhotoStorage {
  constructor(private readonly config: AppConfigService) {
    super();
  }

  validate(photo: UploadedPhoto): void {
    if (!EXTENSION_BY_MIME_TYPE[photo.mimeType]) {
      throw new InvalidPhotoError('El archivo debe ser JPEG, PNG o WebP.');
    }
    if (photo.sizeBytes > MAX_SIZE_BYTES) {
      throw new InvalidPhotoError('El archivo no puede superar los 5MB.');
    }
  }

  async save(accountId: string, photo: UploadedPhoto): Promise<string> {
    this.validate(photo);
    const extension = EXTENSION_BY_MIME_TYPE[photo.mimeType];
    const fotoPath = `${accountId}.${extension}`;
    await mkdir(this.config.skaterPhotoStorageDir, { recursive: true });
    await writeFile(join(this.config.skaterPhotoStorageDir, fotoPath), photo.buffer);
    return fotoPath;
  }

  async read(fotoPath: string): Promise<StoredPhoto | null> {
    try {
      const buffer = await readFile(join(this.config.skaterPhotoStorageDir, fotoPath));
      const extension = fotoPath.split('.').pop();
      const mimeType =
        Object.entries(EXTENSION_BY_MIME_TYPE).find(([, ext]) => ext === extension)?.[0] ??
        'application/octet-stream';
      return { buffer, mimeType };
    } catch {
      return null;
    }
  }
}
