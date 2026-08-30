import type { ScheduledClassResponse } from '@nodoskatepark/contracts';
import { categoryLabel, DAY_LABELS, minutesToTime } from './format';

interface Props {
  classes: ScheduledClassResponse[];
  canEdit: boolean;
  onEdit?: (item: ScheduledClassResponse) => void;
  onDelete?: (item: ScheduledClassResponse) => void;
  emptyLabel?: string;
}

/**
 * The classes of one day, ordered by start time.
 *
 * Each row states its day, its hours and its category as text (FR-004a): the category is never told
 * by colour alone, so a screen reader announces exactly what a sighted person sees.
 *
 * `canEdit` is false for an instructor, who consults the grid but does not configure it. The screen
 * offers nothing that would later be rejected (FR-028) — while the server rejects it anyway
 * (FR-027).
 */
export function DayClassList({ classes, canEdit, onEdit, onDelete, emptyLabel }: Props) {
  if (classes.length === 0) {
    return <p className="cs-empty">{emptyLabel ?? 'No hay clases este día.'}</p>;
  }

  return (
    <ul className="cs-list">
      {classes.map((item) => {
        const time = `${minutesToTime(item.startsAtMinute)} a ${minutesToTime(item.endsAtMinute)}`;
        const category = categoryLabel(item.ageGroup, item.level);
        return (
          <li className="cs-class" key={item.id}>
            <span className="cs-class__time">{time}</span>
            <span className="cs-class__category">{category}</span>
            <span className="cs-visually-hidden">{DAY_LABELS[item.dayOfWeek]}</span>
            {canEdit ? (
              <span className="cs-class__actions">
                <button
                  type="button"
                  className="cs-class__action"
                  onClick={() => onEdit?.(item)}
                  aria-label={`Editar la clase de ${DAY_LABELS[item.dayOfWeek]} ${time}, ${category}`}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="cs-class__action"
                  onClick={() => onDelete?.(item)}
                  aria-label={`Eliminar la clase de ${DAY_LABELS[item.dayOfWeek]} ${time}, ${category}`}
                >
                  Eliminar
                </button>
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
