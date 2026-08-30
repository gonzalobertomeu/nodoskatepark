import type { ScheduledClass, ScheduledClassDraft } from '../entities/scheduled-class.entity';
import type { SkateparkDayHours } from '../entities/skatepark-hours.entity';

/**
 * Every business rule of the class schedule, as pure functions (007-class-schedule-config).
 *
 * No database, no framework, no NestJS decorators — Principle II keeps the domain free of both, and
 * it is what lets these be tested by the dozen in milliseconds. Concentrating them here is also
 * what stops validation from ending up scattered between the controller and the screen.
 *
 * Minutes since midnight throughout. `MINUTES_IN_DAY` is an allowed END value but never a START:
 * a class may finish at midnight, not begin there.
 */

export const MINUTES_IN_DAY = 1440;

export type ScheduleRuleViolation =
  | { rule: 'invalid_range' }
  | { rule: 'overlap'; conflictingClass: ScheduledClass }
  | { rule: 'day_closed' }
  | { rule: 'outside_opening_hours'; opensAtMinute: number; closesAtMinute: number };

/**
 * FR-019 and FR-020 at once. Because the entity carries no date, a class that would cross midnight
 * cannot even be represented — the check below is the whole of it.
 */
export function isValidRange(startsAtMinute: number, endsAtMinute: number): boolean {
  return (
    Number.isInteger(startsAtMinute) &&
    Number.isInteger(endsAtMinute) &&
    startsAtMinute >= 0 &&
    endsAtMinute <= MINUTES_IN_DAY &&
    startsAtMinute < endsAtMinute
  );
}

/**
 * Half-open intervals: two classes that merely touch at the edge — 17:00-18:00 and 18:00-19:00 —
 * do not overlap.
 */
export function overlaps(
  a: { startsAtMinute: number; endsAtMinute: number },
  b: { startsAtMinute: number; endsAtMinute: number },
): boolean {
  return a.startsAtMinute < b.endsAtMinute && b.startsAtMinute < a.endsAtMinute;
}

/**
 * FR-021: rejected even when the categories differ. The skatepark teaches one class at a time —
 * confirmed with the business, so there is no notion of a track or space to disambiguate by.
 *
 * `excludeClassId` is what lets an edit not collide with itself.
 */
export function findOverlappingClass(
  draft: Pick<ScheduledClassDraft, 'dayOfWeek' | 'startsAtMinute' | 'endsAtMinute'>,
  existing: ScheduledClass[],
  excludeClassId?: string,
): ScheduledClass | null {
  return (
    existing.find(
      (other) =>
        other.id !== excludeClassId &&
        other.dayOfWeek === draft.dayOfWeek &&
        overlaps(draft, other),
    ) ?? null
  );
}

/**
 * FR-014, FR-015, FR-015a and FR-018 together.
 *
 * `hours === undefined` means the day is unconfigured, and an unconfigured day restricts nothing.
 * That is the opposite of `closed`, which allows nothing — the distinction FR-018 depends on.
 */
export function checkAgainstOpeningHours(
  draft: Pick<ScheduledClassDraft, 'startsAtMinute' | 'endsAtMinute'>,
  hours: SkateparkDayHours | undefined,
): ScheduleRuleViolation | null {
  if (!hours) {
    return null;
  }
  if (hours.closed) {
    return { rule: 'day_closed' };
  }
  if (hours.opensAtMinute === null || hours.closesAtMinute === null) {
    return null;
  }
  if (draft.startsAtMinute < hours.opensAtMinute || draft.endsAtMinute > hours.closesAtMinute) {
    return {
      rule: 'outside_opening_hours',
      opensAtMinute: hours.opensAtMinute,
      closesAtMinute: hours.closesAtMinute,
    };
  }
  return null;
}

/** FR-017: a day cannot close before, or at, the moment it opens. */
export function isValidDayHours(hours: SkateparkDayHours): boolean {
  if (hours.closed) {
    return hours.opensAtMinute === null && hours.closesAtMinute === null;
  }
  return (
    hours.opensAtMinute !== null &&
    hours.closesAtMinute !== null &&
    isValidRange(hours.opensAtMinute, hours.closesAtMinute)
  );
}

/**
 * FR-016: which classes a change to a day's hours would leave outside.
 *
 * The system never moves or deletes a class on its own — it names the ones that block the change
 * and lets a person resolve it.
 */
export function classesLeftOutside(
  hours: SkateparkDayHours,
  classesThatDay: ScheduledClass[],
): ScheduledClass[] {
  if (hours.closed) {
    return [...classesThatDay];
  }
  if (hours.opensAtMinute === null || hours.closesAtMinute === null) {
    return [];
  }
  const opens = hours.opensAtMinute;
  const closes = hours.closesAtMinute;
  return classesThatDay.filter((item) => item.startsAtMinute < opens || item.endsAtMinute > closes);
}
