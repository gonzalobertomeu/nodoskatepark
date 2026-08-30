import { DAYS_OF_WEEK, type ScheduledClassResponse } from '@nodoskatepark/contracts';
import { DayClassList } from './DayClassList';
import { DAY_LABELS } from './format';

interface Props {
  classesByDay: Record<string, ScheduledClassResponse[]>;
  canEdit: boolean;
  onEdit?: (item: ScheduledClassResponse) => void;
  onDelete?: (item: ScheduledClassResponse) => void;
}

/**
 * The whole week in columns, from 1024 px up (FR-001b).
 *
 * Fed by the same read and rendering the same `DayClassList` rows as the phone, so the set of
 * classes, their information and the depth of every path cannot diverge between breakpoints
 * (SC-005a). The only thing that changes is how many days are visible at once.
 */
export function WeekColumns({ classesByDay, canEdit, onEdit, onDelete }: Props) {
  return (
    <div className="cs-week">
      {DAYS_OF_WEEK.map((day) => (
        <section className="cs-week__day" key={day}>
          <h2 className="cs-week__heading">{DAY_LABELS[day]}</h2>
          <DayClassList
            classes={classesByDay[day] ?? []}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
            emptyLabel="Sin clases"
          />
        </section>
      ))}
    </div>
  );
}
