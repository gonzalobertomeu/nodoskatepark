import {
  type ClassAgeGroup,
  type ClassLevel,
  classAgeGroupSchema,
  classLevelSchema,
  DAYS_OF_WEEK,
  type DayOfWeek,
  type ScheduledClassInput,
  type ScheduledClassResponse,
} from '@nodoskatepark/contracts';
import { useId, useRef, useState } from 'react';
import {
  AGE_GROUP_LABELS,
  categoryLabel,
  DAY_LABELS,
  LEVEL_LABELS,
  minutesToTime,
  timeToMinutes,
} from './format';
import { Sheet } from './Sheet';

interface Props {
  day: DayOfWeek;
  editing: ScheduledClassResponse | null;
  submitting: boolean;
  error: { message: string; conflictingClass?: ScheduledClassResponse } | null;
  onSubmit: (input: ScheduledClassInput) => void;
  onClose: () => void;
}

const DEFAULT_START = '17:00';
/** FR-003: one hour is proposed, not imposed — the person can change it. */
const DEFAULT_DURATION_MINUTES = 60;

export function ClassFormSheet({ day, editing, submitting, error, onSubmit, onClose }: Props) {
  const ids = {
    day: useId(),
    start: useId(),
    end: useId(),
    age: useId(),
    level: useId(),
  };

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(editing?.dayOfWeek ?? day);
  const [start, setStart] = useState(
    editing ? minutesToTime(editing.startsAtMinute) : DEFAULT_START,
  );
  const [end, setEnd] = useState(
    editing
      ? minutesToTime(editing.endsAtMinute)
      : minutesToTime((timeToMinutes(DEFAULT_START) ?? 0) + DEFAULT_DURATION_MINUTES),
  );
  const [ageGroup, setAgeGroup] = useState<ClassAgeGroup | ''>(editing?.ageGroup ?? '');
  const [level, setLevel] = useState<ClassLevel | ''>(editing?.level ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLSelectElement>(null);
  const levelRef = useRef<HTMLSelectElement>(null);

  /** FR-003: moving the start carries the proposed end with it, keeping the hour of duration. */
  function handleStartChange(value: string): void {
    setStart(value);
    const startMinutes = timeToMinutes(value);
    const endMinutes = timeToMinutes(end);
    const previousStart = timeToMinutes(start);
    if (startMinutes === null) {
      return;
    }
    const keepsDefaultDuration =
      endMinutes === null ||
      previousStart === null ||
      endMinutes - previousStart === DEFAULT_DURATION_MINUTES;
    if (keepsDefaultDuration) {
      setEnd(minutesToTime(Math.min(startMinutes + DEFAULT_DURATION_MINUTES, 1440)));
    }
  }

  /**
   * FR-022a: a rejection is announced and moves focus to the field that needs fixing, instead of
   * leaving it where it was.
   */
  function fail(message: string, field: HTMLElement | null): void {
    setLocalError(message);
    field?.focus();
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    setLocalError(null);

    const startsAtMinute = timeToMinutes(start);
    if (startsAtMinute === null) {
      fail('Escribí la hora de inicio como HH:MM.', startRef.current);
      return;
    }
    const endsAtMinute = timeToMinutes(end);
    if (endsAtMinute === null) {
      fail('Escribí la hora de fin como HH:MM.', endRef.current);
      return;
    }
    if (endsAtMinute <= startsAtMinute) {
      fail('La hora de fin tiene que ser posterior a la de inicio.', endRef.current);
      return;
    }
    // FR-011: both halves of the category are required, and the message says which one is missing.
    if (ageGroup === '') {
      fail('Elegí la franja etaria de la clase.', ageRef.current);
      return;
    }
    if (level === '') {
      fail('Elegí el nivel de la clase.', levelRef.current);
      return;
    }

    onSubmit({ dayOfWeek, startsAtMinute, endsAtMinute, ageGroup, level });
  }

  const shownError = localError ?? error?.message ?? null;

  return (
    <Sheet title={editing ? 'Editar clase' : 'Nueva clase'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {shownError ? (
          <p className="nb-error" role="alert">
            {shownError}
            {error?.conflictingClass ? (
              <>
                {' '}
                Choca con la de {minutesToTime(error.conflictingClass.startsAtMinute)} a{' '}
                {minutesToTime(error.conflictingClass.endsAtMinute)} (
                {categoryLabel(error.conflictingClass.ageGroup, error.conflictingClass.level)}).
              </>
            ) : null}
          </p>
        ) : null}

        <div className="nb-field">
          <label className="nb-label" htmlFor={ids.day}>
            Día
          </label>
          <select
            id={ids.day}
            className="nb-input"
            value={dayOfWeek}
            onChange={(event) => setDayOfWeek(event.target.value as DayOfWeek)}
          >
            {DAYS_OF_WEEK.map((value) => (
              <option key={value} value={value}>
                {DAY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="nb-field">
          <label className="nb-label" htmlFor={ids.start}>
            Hora de inicio
          </label>
          <input
            id={ids.start}
            ref={startRef}
            className="nb-input"
            type="time"
            value={start}
            onChange={(event) => handleStartChange(event.target.value)}
          />
        </div>

        <div className="nb-field">
          <label className="nb-label" htmlFor={ids.end}>
            Hora de fin
          </label>
          <input
            id={ids.end}
            ref={endRef}
            className="nb-input"
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>

        <div className="nb-field">
          <label className="nb-label" htmlFor={ids.age}>
            Franja etaria
          </label>
          <select
            id={ids.age}
            ref={ageRef}
            className="nb-input"
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value as ClassAgeGroup | '')}
          >
            <option value="">Elegí una opción</option>
            {classAgeGroupSchema.options.map((value) => (
              <option key={value} value={value}>
                {AGE_GROUP_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="nb-field">
          <label className="nb-label" htmlFor={ids.level}>
            Nivel
          </label>
          <select
            id={ids.level}
            ref={levelRef}
            className="nb-input"
            value={level}
            onChange={(event) => setLevel(event.target.value as ClassLevel | '')}
          >
            <option value="">Elegí una opción</option>
            {classLevelSchema.options.map((value) => (
              <option key={value} value={value}>
                {LEVEL_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="cs-sheet__actions">
          <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="nb-button" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
        </div>
      </form>
    </Sheet>
  );
}
