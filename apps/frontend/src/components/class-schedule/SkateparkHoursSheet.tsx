import type {
  DayOfWeek,
  ScheduledClassResponse,
  SetSkateparkDayHoursRequest,
  SkateparkDayHoursResponse,
} from '@nodoskatepark/contracts';
import { useId, useRef, useState } from 'react';
import { categoryLabel, DAY_LABELS, minutesToTime, timeToMinutes } from './format';
import { Sheet } from './Sheet';

interface Props {
  day: DayOfWeek;
  current: SkateparkDayHoursResponse | undefined;
  submitting: boolean;
  error: { message: string; conflictingClasses?: ScheduledClassResponse[] } | null;
  onSubmit: (input: SetSkateparkDayHoursRequest) => void;
  onClose: () => void;
}

/**
 * The opening hours of one weekday (FR-012, FR-013).
 *
 * When the change would leave classes outside the new range, the sheet lists them by name (FR-016).
 * The system never moves or deletes a class on its own — resolving it is a person's decision.
 */
export function SkateparkHoursSheet({ day, current, submitting, error, onSubmit, onClose }: Props) {
  const ids = { closed: useId(), opens: useId(), closes: useId() };
  const [closed, setClosed] = useState(current?.closed ?? false);
  const [opens, setOpens] = useState(
    current?.opensAtMinute != null ? minutesToTime(current.opensAtMinute) : '14:00',
  );
  const [closes, setCloses] = useState(
    current?.closesAtMinute != null ? minutesToTime(current.closesAtMinute) : '22:00',
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const opensRef = useRef<HTMLInputElement>(null);
  const closesRef = useRef<HTMLInputElement>(null);

  function fail(message: string, field: HTMLElement | null): void {
    setLocalError(message);
    field?.focus();
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    setLocalError(null);

    if (closed) {
      onSubmit({ closed: true });
      return;
    }

    const opensAtMinute = timeToMinutes(opens);
    if (opensAtMinute === null) {
      fail('Escribí la hora de apertura como HH:MM.', opensRef.current);
      return;
    }
    const closesAtMinute = timeToMinutes(closes);
    if (closesAtMinute === null) {
      fail('Escribí la hora de cierre como HH:MM.', closesRef.current);
      return;
    }
    if (closesAtMinute <= opensAtMinute) {
      fail('La hora de cierre tiene que ser posterior a la de apertura.', closesRef.current);
      return;
    }

    onSubmit({ closed: false, opensAtMinute, closesAtMinute });
  }

  const shownError = localError ?? error?.message ?? null;

  return (
    <Sheet title={`Horario del ${DAY_LABELS[day].toLowerCase()}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {shownError ? (
          <div className="nb-error" role="alert">
            <p style={{ margin: 0 }}>{shownError}</p>
            {error?.conflictingClasses?.length ? (
              <ul className="cs-conflicts">
                {error.conflictingClasses.map((item) => (
                  <li key={item.id}>
                    {minutesToTime(item.startsAtMinute)} a {minutesToTime(item.endsAtMinute)} —{' '}
                    {categoryLabel(item.ageGroup, item.level)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="nb-field">
          <label className="nb-label" htmlFor={ids.closed}>
            <input
              id={ids.closed}
              type="checkbox"
              checked={closed}
              onChange={(event) => setClosed(event.target.checked)}
            />{' '}
            El skatepark no abre este día
          </label>
        </div>

        {closed ? null : (
          <>
            <div className="nb-field">
              <label className="nb-label" htmlFor={ids.opens}>
                Abre a las
              </label>
              <input
                id={ids.opens}
                ref={opensRef}
                className="nb-input"
                type="time"
                value={opens}
                onChange={(event) => setOpens(event.target.value)}
              />
            </div>
            <div className="nb-field">
              <label className="nb-label" htmlFor={ids.closes}>
                Cierra a las
              </label>
              <input
                id={ids.closes}
                ref={closesRef}
                className="nb-input"
                type="time"
                value={closes}
                onChange={(event) => setCloses(event.target.value)}
              />
            </div>
          </>
        )}

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
