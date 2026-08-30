import { DAYS_OF_WEEK, type DayOfWeek } from '@nodoskatepark/contracts';
import { DAY_SHORT_LABELS } from './format';

interface Props {
  selected: DayOfWeek;
  onSelect: (day: DayOfWeek) => void;
}

/**
 * Buttons with `aria-pressed`, not a tablist (research.md §9).
 *
 * FR-033 asks for keyboard reach and activation with a visible focus ring, which a button gives for
 * free. A `role="tablist"` would be more specific semantically but demands roving tabindex and
 * arrow-key navigation to not end up worse than a half-implemented group of buttons — more
 * machinery than this feature's accessibility floor requires.
 */
export function DaySelector({ selected, onSelect }: Props) {
  return (
    <fieldset className="cs-days">
      <legend className="cs-visually-hidden">Día de la semana</legend>
      {DAYS_OF_WEEK.map((day) => (
        <button
          key={day}
          type="button"
          className="cs-day"
          aria-pressed={day === selected}
          onClick={() => onSelect(day)}
        >
          {DAY_SHORT_LABELS[day]}
        </button>
      ))}
    </fieldset>
  );
}
