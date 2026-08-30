import { z } from 'zod';
import { scheduledClassSchema } from './schedule.contract';

export const ClassScheduleErrorCode = {
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  InvalidInput: 'invalid_input',
  OverlapConflict: 'overlap_conflict',
  OutsideOpeningHours: 'outside_opening_hours',
  DayClosed: 'day_closed',
} as const;

export type ClassScheduleErrorCode =
  (typeof ClassScheduleErrorCode)[keyof typeof ClassScheduleErrorCode];

/**
 * Conflicts carry data, not just a message.
 *
 * FR-022 requires telling the person what to fix, and FR-016 requires naming the classes that block
 * a change to the opening hours. Without `conflictingClass`/`conflictingClasses` the screen could
 * only say "there is a conflict" and leave them to find it by hand.
 */
export const classScheduleErrorBodySchema = z.object({
  error: z.enum([
    ClassScheduleErrorCode.Unauthenticated,
    ClassScheduleErrorCode.Forbidden,
    ClassScheduleErrorCode.NotFound,
    ClassScheduleErrorCode.InvalidInput,
    ClassScheduleErrorCode.OverlapConflict,
    ClassScheduleErrorCode.OutsideOpeningHours,
    ClassScheduleErrorCode.DayClosed,
  ]),
  message: z.string(),
  /** overlap_conflict: the class it collides with. */
  conflictingClass: scheduledClassSchema.optional(),
  /** Changing a day's hours: the classes that would fall outside the new range (FR-016). */
  conflictingClasses: z.array(scheduledClassSchema).optional(),
});

export type ClassScheduleErrorBody = z.infer<typeof classScheduleErrorBodySchema>;
