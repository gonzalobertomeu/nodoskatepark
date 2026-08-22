import { Injectable, Logger } from '@nestjs/common';

export type InstructorAssignmentEvent =
  | 'promoted_existing_user'
  | 'promotion_no_op'
  | 'instructor_invited'
  | 'invitation_resolved'
  | 'invitation_cancelled';

/**
 * Structured (JSON) logging for instructor-assignment writes, mirroring auth's
 * SecurityLoggerService and skater-directory's SkaterDirectoryLoggerService — accountIds/emails
 * only, never other account data.
 */
@Injectable()
export class InstructorAssignmentLoggerService {
  private readonly logger = new Logger('InstructorAssignmentEvent');

  log(
    event: InstructorAssignmentEvent,
    context: Record<string, string | number | undefined> = {},
  ): void {
    this.logger.log(JSON.stringify({ event, ...context }));
  }
}
