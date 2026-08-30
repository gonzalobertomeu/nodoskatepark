export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type ClassAgeGroup = 'menores' | 'adultos';
export type ClassLevel = 'iniciantes' | 'intermedios' | 'avanzados';

/**
 * A weekly class slot (007-class-schedule-config).
 *
 * `startsAtMinute` / `endsAtMinute` are MINUTES SINCE MIDNIGHT, never dates. That is what makes
 * FR-018a hold by construction: the hour is local wall-clock time, so no seasonal clock change
 * shifts it and nothing can convert it to a viewer's timezone.
 *
 * There is no date field at all, which is deliberate twice over: it is what makes the slot recur
 * every week (FR-007), and what makes "what did the grid look like three months ago" unanswerable
 * by design (FR-025a).
 */
export interface ScheduledClass {
  id: string;
  dayOfWeek: DayOfWeek;
  startsAtMinute: number;
  endsAtMinute: number;
  ageGroup: ClassAgeGroup;
  level: ClassLevel;
}

export type ScheduledClassDraft = Omit<ScheduledClass, 'id'>;
