import type { ClassAgeGroup, ClassLevel, DayOfWeek } from '@nodoskatepark/contracts';

/**
 * The formatting boundary (data-model.md §3).
 *
 * Inside the system an hour is always an integer count of minutes. "HH:MM" exists only here, at the
 * edge where something is painted or a form field is read. Keeping the conversion in one place is
 * what stops anyone from reinterpreting an hour with a timezone somewhere along the way (FR-018a).
 */

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
};

export const AGE_GROUP_LABELS: Record<ClassAgeGroup, string> = {
  menores: 'Menores',
  adultos: 'Adultos',
};

export const LEVEL_LABELS: Record<ClassLevel, string> = {
  iniciantes: 'Iniciantes',
  intermedios: 'Intermedios',
  avanzados: 'Avanzados',
};

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** Returns null when the value is not a well-formed "HH:MM" — the caller decides what to say. */
export function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function categoryLabel(ageGroup: ClassAgeGroup, level: ClassLevel): string {
  return `${AGE_GROUP_LABELS[ageGroup]} · ${LEVEL_LABELS[level]}`;
}

/** The day the selector opens on (FR-001c). `getDay()` is 0-based on Sunday. */
export function currentDayOfWeek(now: Date = new Date()): DayOfWeek {
  const order: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return order[now.getDay()];
}
