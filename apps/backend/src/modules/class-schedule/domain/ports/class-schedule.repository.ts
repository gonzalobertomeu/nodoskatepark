import type {
  DayOfWeek,
  ScheduledClass,
  ScheduledClassDraft,
} from '../entities/scheduled-class.entity';
import type { SkateparkDayHours } from '../entities/skatepark-hours.entity';

/**
 * Declared as an abstract class, not an interface: Principle II requires the abstraction to double
 * as its own DI token, and an interface is erased at compile time.
 */
export abstract class ClassScheduleRepository {
  /** Ordered by weekday and then by start time, so the screen never has to reorder. */
  abstract listClasses(): Promise<ScheduledClass[]>;

  /** Only the configured days; a missing day is unconfigured, not closed. */
  abstract listHours(): Promise<SkateparkDayHours[]>;

  abstract findClassById(id: string): Promise<ScheduledClass | null>;

  /**
   * Runs `check` against the classes of that weekday and writes only if it returns null, both
   * inside one transaction. That is what closes the window between "I checked there was no
   * conflict" and "I saved" (research.md §5).
   */
  abstract createClassChecked(
    draft: ScheduledClassDraft,
    check: (sameDay: ScheduledClass[], hours: SkateparkDayHours | undefined) => Error | null,
  ): Promise<ScheduledClass>;

  abstract updateClassChecked(
    id: string,
    draft: ScheduledClassDraft,
    check: (sameDay: ScheduledClass[], hours: SkateparkDayHours | undefined) => Error | null,
  ): Promise<ScheduledClass>;

  abstract deleteClass(id: string): Promise<void>;

  abstract setDayHoursChecked(
    hours: SkateparkDayHours,
    check: (classesThatDay: ScheduledClass[]) => Error | null,
  ): Promise<SkateparkDayHours>;

  abstract listClassesForDay(dayOfWeek: DayOfWeek): Promise<ScheduledClass[]>;
}
