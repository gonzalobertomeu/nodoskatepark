import type {
  DayOfWeek,
  ScheduledClassInput,
  ScheduledClassResponse,
  SetSkateparkDayHoursRequest,
  SkateparkDayHoursResponse,
} from '@nodoskatepark/contracts';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../../app/session-context';
import { ClassScheduleApiError, classScheduleClient } from '../../services/class-schedule-client';
import { ClassFormSheet } from './ClassFormSheet';
import { DayClassList } from './DayClassList';
import { DaySelector } from './DaySelector';
import { currentDayOfWeek, DAY_LABELS, minutesToTime } from './format';
import { SkateparkHoursSheet } from './SkateparkHoursSheet';
import { WeekColumns } from './WeekColumns';

type Sheet =
  | { mode: 'create' }
  | { mode: 'edit'; item: ScheduledClassResponse }
  | { mode: 'hours' }
  | null;

interface SheetError {
  message: string;
  conflictingClass?: ScheduledClassResponse;
  conflictingClasses?: ScheduledClassResponse[];
}

/**
 * The "Horarios de clases" destination (007-class-schedule-config).
 *
 * Reads the grid and the opening hours in one call — the screen shows them together and a class
 * cannot be validated against anything without the hours (research.md §6).
 *
 * Phone shows one day at a time with a day selector; tablet and desktop show the week in columns.
 * Seven days by time slots does not fit 320 px without horizontal scrolling, which Principle IX
 * forbids (FR-001a, FR-001b).
 */
export function ClassSchedulePanel() {
  const session = useSession();
  const canEdit = session.role === 'administrador';

  const [classes, setClasses] = useState<ScheduledClassResponse[]>([]);
  const [hours, setHours] = useState<SkateparkDayHoursResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDayOfWeek());
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetError, setSheetError] = useState<SheetError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await classScheduleClient.getSchedule();
      setClasses(result.classes);
      setHours(result.hours);
    } catch {
      setLoadError('No pudimos cargar el calendario. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const closeSheet = useCallback(() => {
    setSheet(null);
    setSheetError(null);
  }, []);

  function describeFailure(error: unknown): SheetError {
    if (error instanceof ClassScheduleApiError) {
      return {
        message: error.body.message,
        conflictingClass: error.body.conflictingClass,
        conflictingClasses: error.body.conflictingClasses,
      };
    }
    return { message: 'No pudimos guardar el cambio. Intentá de nuevo.' };
  }

  async function saveClass(input: ScheduledClassInput): Promise<void> {
    setSubmitting(true);
    setSheetError(null);
    try {
      if (sheet?.mode === 'edit') {
        await classScheduleClient.updateClass(sheet.item.id, input);
      } else {
        await classScheduleClient.createClass(input);
      }
      closeSheet();
      await load();
    } catch (error) {
      setSheetError(describeFailure(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveHours(input: SetSkateparkDayHoursRequest): Promise<void> {
    setSubmitting(true);
    setSheetError(null);
    try {
      await classScheduleClient.setDayHours(selectedDay, input);
      closeSheet();
      await load();
    } catch (error) {
      setSheetError(describeFailure(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeClass(item: ScheduledClassResponse): Promise<void> {
    // FR-024: an explicit confirmation before deleting.
    const time = `${minutesToTime(item.startsAtMinute)} a ${minutesToTime(item.endsAtMinute)}`;
    if (!window.confirm(`¿Eliminar la clase de ${DAY_LABELS[item.dayOfWeek]} de ${time}?`)) {
      return;
    }
    try {
      await classScheduleClient.deleteClass(item.id);
      await load();
    } catch {
      setLoadError('No pudimos eliminar la clase. Intentá de nuevo.');
    }
  }

  if (loading) {
    return (
      <div className="app-skeleton" aria-hidden="true">
        <span className="app-skeleton__line" />
        <span className="app-skeleton__line" />
        <span className="app-skeleton__line" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-state app-state--error" role="alert">
        <p className="app-state__title">No pudimos cargar el calendario</p>
        <p className="app-state__body">
          Puede ser un problema de conexión. Probá de nuevo, o pasá a otro destino desde la barra.
        </p>
        <button type="button" className="nb-button" onClick={() => void load()}>
          Reintentar
        </button>
      </div>
    );
  }

  const classesByDay = classes.reduce<Record<string, ScheduledClassResponse[]>>((acc, item) => {
    const forDay = acc[item.dayOfWeek] ?? [];
    forDay.push(item);
    acc[item.dayOfWeek] = forDay;
    return acc;
  }, {});

  const dayHours = hours.find((entry) => entry.dayOfWeek === selectedDay);

  return (
    <div>
      {canEdit ? (
        <div className="cs-sheet__actions" style={{ marginTop: 0, marginBottom: '1rem' }}>
          <button
            type="button"
            className="nb-button nb-button-accent"
            onClick={() => setSheet({ mode: 'create' })}
          >
            Nueva clase
          </button>
          <button type="button" className="nb-button" onClick={() => setSheet({ mode: 'hours' })}>
            Horario del skatepark
          </button>
        </div>
      ) : null}

      <div className="cs-day-view">
        <DaySelector selected={selectedDay} onSelect={setSelectedDay} />

        {/* The three states are distinguishable on purpose: unconfigured allows any class,
            closed allows none — they are opposites, not variations (FR-018, FR-015a). */}
        <p className={`cs-hours${dayHours?.closed ? ' cs-hours--closed' : ''}`}>
          {dayHours === undefined
            ? `El horario del ${DAY_LABELS[selectedDay].toLowerCase()} todavía no está definido.`
            : dayHours.closed
              ? `El skatepark no abre los ${DAY_LABELS[selectedDay].toLowerCase()}.`
              : `Abre de ${minutesToTime(dayHours.opensAtMinute ?? 0)} a ${minutesToTime(
                  dayHours.closesAtMinute ?? 0,
                )}.`}
        </p>

        <DayClassList
          classes={classesByDay[selectedDay] ?? []}
          canEdit={canEdit}
          onEdit={(item) => setSheet({ mode: 'edit', item })}
          onDelete={(item) => void removeClass(item)}
          emptyLabel={
            canEdit
              ? 'No hay clases este día. Creá la primera con «Nueva clase».'
              : 'No hay clases este día.'
          }
        />
      </div>

      <WeekColumns
        classesByDay={classesByDay}
        canEdit={canEdit}
        onEdit={(item) => setSheet({ mode: 'edit', item })}
        onDelete={(item) => void removeClass(item)}
      />

      {sheet?.mode === 'create' || sheet?.mode === 'edit' ? (
        <ClassFormSheet
          day={selectedDay}
          editing={sheet.mode === 'edit' ? sheet.item : null}
          submitting={submitting}
          error={sheetError}
          onSubmit={(input) => void saveClass(input)}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.mode === 'hours' ? (
        <SkateparkHoursSheet
          day={selectedDay}
          current={dayHours}
          submitting={submitting}
          error={sheetError}
          onSubmit={(input) => void saveHours(input)}
          onClose={closeSheet}
        />
      ) : null}
    </div>
  );
}
