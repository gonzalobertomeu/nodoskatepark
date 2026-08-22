export interface UploadedPhoto {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

export interface StoredPhoto {
  buffer: Buffer;
  mimeType: string;
}

export class InvalidPhotoError extends Error {}

/**
 * Local-disk backed (research.md #1) — the accountId-scoped path/mimetype/size validation
 * (JPEG/PNG/WebP, ≤5MB — FR-013) lives in the concrete adapter, since it's inherent to "safely
 * accepting and storing a photo," not a business rule specific to any use case.
 */
export abstract class PhotoStorage {
  /** Throws InvalidPhotoError if the type/size isn't accepted (FR-013). */
  abstract validate(photo: UploadedPhoto): void;
  abstract save(accountId: string, photo: UploadedPhoto): Promise<string>;
  abstract read(fotoPath: string): Promise<StoredPhoto | null>;
}
