import { Injectable, Logger } from '@nestjs/common';

export type SkaterProfileEvent = 'basic_info_completed' | 'basic_info_updated';

/**
 * Structured (JSON) logging for skater-profile writes, mirroring auth's SecurityLoggerService —
 * accountId only, never the submitted nombre/apellido/fechaDeNacimiento values.
 */
@Injectable()
export class SkaterProfileLoggerService {
  private readonly logger = new Logger('SkaterProfileEvent');

  log(event: SkaterProfileEvent, context: Record<string, string | number | undefined> = {}): void {
    this.logger.log(JSON.stringify({ event, ...context }));
  }
}
