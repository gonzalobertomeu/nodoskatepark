import { Injectable } from '@nestjs/common';
import { LastCheckInReader } from '../../domain/ports/last-check-in-reader';

/**
 * No check-in/access-control feature exists yet. Always resolves `null`, which is exactly
 * FR-008's required "sin ingresos registrados" state — not a placeholder error, a correct
 * answer for this feature's current scope. Replace with a real implementation, rebinding the
 * `LastCheckInReader` port, once a check-in feature exists (research.md #2).
 */
@Injectable()
export class StubLastCheckInReader extends LastCheckInReader {
  async findLastCheckInAt(_accountId: string): Promise<Date | null> {
    return null;
  }
}
