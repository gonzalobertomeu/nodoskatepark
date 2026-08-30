import type { DayOfWeek } from './scheduled-class.entity';

/**
 * The skatepark's opening hours for one weekday.
 *
 * The absence of a record is a third, meaningful state — see `SkateparkHoursByDay`.
 */
export interface SkateparkDayHours {
  dayOfWeek: DayOfWeek;
  closed: boolean;
  opensAtMinute: number | null;
  closesAtMinute: number | null;
}

/**
 * Only the configured days are present. A missing day is UNCONFIGURED, which is not the same as
 * closed: unconfigured allows any class (FR-018), closed allows none (FR-015a). Collapsing the two
 * would make a day nobody touched indistinguishable from one closed on purpose.
 */
export type SkateparkHoursByDay = Partial<Record<DayOfWeek, SkateparkDayHours>>;
