import { Injectable, Logger } from '@nestjs/common';

export type SkaterDirectoryEvent = 'editable_fields_updated' | 'photo_uploaded';

/**
 * Structured (JSON) logging for skater-directory writes, mirroring auth's SecurityLoggerService
 * and skater-profile's SkaterProfileLoggerService — accountIds only, never the submitted
 * apodo/afecciones/photo content.
 */
@Injectable()
export class SkaterDirectoryLoggerService {
  private readonly logger = new Logger('SkaterDirectoryEvent');

  log(
    event: SkaterDirectoryEvent,
    context: Record<string, string | number | undefined> = {},
  ): void {
    this.logger.log(JSON.stringify({ event, ...context }));
  }
}
