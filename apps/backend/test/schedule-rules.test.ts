import { describe, expect, test } from 'bun:test';
import type { ScheduledClass } from '../src/modules/class-schedule/domain/entities/scheduled-class.entity';
import type { SkateparkDayHours } from '../src/modules/class-schedule/domain/entities/skatepark-hours.entity';
import {
  checkAgainstOpeningHours,
  classesLeftOutside,
  findOverlappingClass,
  isValidDayHours,
  isValidRange,
  MINUTES_IN_DAY,
} from '../src/modules/class-schedule/domain/services/schedule-rules';

const h = (hour: number, minute = 0) => hour * 60 + minute;

function cls(over: Partial<ScheduledClass> = {}): ScheduledClass {
  return {
    id: 'c1',
    dayOfWeek: 'tuesday',
    startsAtMinute: h(17),
    endsAtMinute: h(18),
    ageGroup: 'menores',
    level: 'iniciantes',
    ...over,
  };
}

describe('rango de una clase (FR-019, FR-020)', () => {
  test('el fin tiene que ser posterior al inicio', () => {
    expect(isValidRange(h(17), h(18))).toBe(true);
    expect(isValidRange(h(18), h(17))).toBe(false);
    expect(isValidRange(h(17), h(17))).toBe(false);
  });

  test('los límites del día son 0 y 1440', () => {
    expect(isValidRange(0, MINUTES_IN_DAY)).toBe(true);
    expect(isValidRange(-1, h(10))).toBe(false);
    expect(isValidRange(h(23), MINUTES_IN_DAY + 1)).toBe(false);
  });

  test('una clase que cruzaría la medianoche no es representable (FR-020)', () => {
    // No hay campo de fecha: 23:00 a 01:00 solo puede escribirse como fin < inicio, que se rechaza.
    expect(isValidRange(h(23), h(1))).toBe(false);
  });

  test('solo admite enteros de minutos, nunca fracciones', () => {
    expect(isValidRange(1020.5, h(18))).toBe(false);
  });
});

describe('solapamiento (FR-021)', () => {
  const existing = [cls({ id: 'a', startsAtMinute: h(17), endsAtMinute: h(18) })];

  test('dos clases que se pisan entran en conflicto', () => {
    const found = findOverlappingClass(
      { dayOfWeek: 'tuesday', startsAtMinute: h(17, 30), endsAtMinute: h(18, 30) },
      existing,
    );
    expect(found?.id).toBe('a');
  });

  test('se rechaza aunque la categoría sea distinta: el skatepark dicta una clase por vez', () => {
    const found = findOverlappingClass(
      { dayOfWeek: 'tuesday', startsAtMinute: h(17, 30), endsAtMinute: h(18, 30) },
      [cls({ id: 'a', ageGroup: 'adultos', level: 'avanzados' })],
    );
    expect(found).not.toBeNull();
  });

  test('dos clases consecutivas que se tocan en el borde no se solapan', () => {
    const found = findOverlappingClass(
      { dayOfWeek: 'tuesday', startsAtMinute: h(18), endsAtMinute: h(19) },
      existing,
    );
    expect(found).toBeNull();
  });

  test('otro día no entra en conflicto', () => {
    const found = findOverlappingClass(
      { dayOfWeek: 'thursday', startsAtMinute: h(17, 30), endsAtMinute: h(18, 30) },
      existing,
    );
    expect(found).toBeNull();
  });

  test('una clase editada no se solapa consigo misma (FR-025)', () => {
    const found = findOverlappingClass(
      { dayOfWeek: 'tuesday', startsAtMinute: h(17, 15), endsAtMinute: h(18, 15) },
      existing,
      'a',
    );
    expect(found).toBeNull();
  });
});

describe('horario del skatepark (FR-014 a FR-018)', () => {
  const open: SkateparkDayHours = {
    dayOfWeek: 'monday',
    closed: false,
    opensAtMinute: h(14),
    closesAtMinute: h(22),
  };

  test('un día sin configurar no restringe nada (FR-018)', () => {
    expect(
      checkAgainstOpeningHours({ startsAtMinute: h(3), endsAtMinute: h(4) }, undefined),
    ).toBeNull();
  });

  test('un día cerrado no admite ninguna clase (FR-015a)', () => {
    const closed: SkateparkDayHours = {
      dayOfWeek: 'sunday',
      closed: true,
      opensAtMinute: null,
      closesAtMinute: null,
    };
    expect(
      checkAgainstOpeningHours({ startsAtMinute: h(15), endsAtMinute: h(16) }, closed)?.rule,
    ).toBe('day_closed');
  });

  test('sin configurar y cerrado son opuestos, no sinónimos (FR-018 vs FR-015a)', () => {
    const draft = { startsAtMinute: h(3), endsAtMinute: h(4) };
    expect(checkAgainstOpeningHours(draft, undefined)).toBeNull();
    expect(
      checkAgainstOpeningHours(draft, {
        dayOfWeek: 'sunday',
        closed: true,
        opensAtMinute: null,
        closesAtMinute: null,
      }),
    ).not.toBeNull();
  });

  test('una clase fuera del rango se rechaza (FR-015)', () => {
    expect(
      checkAgainstOpeningHours({ startsAtMinute: h(9), endsAtMinute: h(10) }, open)?.rule,
    ).toBe('outside_opening_hours');
    expect(
      checkAgainstOpeningHours({ startsAtMinute: h(21), endsAtMinute: h(23) }, open)?.rule,
    ).toBe('outside_opening_hours');
  });

  test('una clase dentro del rango se admite, incluidos los bordes', () => {
    expect(
      checkAgainstOpeningHours({ startsAtMinute: h(15), endsAtMinute: h(16) }, open),
    ).toBeNull();
    expect(
      checkAgainstOpeningHours({ startsAtMinute: h(14), endsAtMinute: h(22) }, open),
    ).toBeNull();
  });

  test('el cierre no puede ser anterior ni igual a la apertura (FR-017)', () => {
    expect(isValidDayHours(open)).toBe(true);
    expect(isValidDayHours({ ...open, opensAtMinute: h(22), closesAtMinute: h(14) })).toBe(false);
    expect(isValidDayHours({ ...open, opensAtMinute: h(14), closesAtMinute: h(14) })).toBe(false);
  });

  test('un día cerrado no lleva horas', () => {
    expect(
      isValidDayHours({
        dayOfWeek: 'sunday',
        closed: true,
        opensAtMinute: null,
        closesAtMinute: null,
      }),
    ).toBe(true);
    expect(
      isValidDayHours({
        dayOfWeek: 'sunday',
        closed: true,
        opensAtMinute: h(9),
        closesAtMinute: h(10),
      }),
    ).toBe(false);
  });
});

describe('cambio de horario que dejaría clases afuera (FR-016)', () => {
  const classes = [
    cls({ id: 'a', dayOfWeek: 'monday', startsAtMinute: h(15), endsAtMinute: h(16) }),
    cls({ id: 'b', dayOfWeek: 'monday', startsAtMinute: h(20), endsAtMinute: h(21) }),
  ];

  test('nombra las clases que impiden achicar el rango', () => {
    const orphaned = classesLeftOutside(
      { dayOfWeek: 'monday', closed: false, opensAtMinute: h(14), closesAtMinute: h(18) },
      classes,
    );
    expect(orphaned.map((c) => c.id)).toEqual(['b']);
  });

  test('cerrar un día con clases las nombra todas', () => {
    const orphaned = classesLeftOutside(
      { dayOfWeek: 'monday', closed: true, opensAtMinute: null, closesAtMinute: null },
      classes,
    );
    expect(orphaned.map((c) => c.id)).toEqual(['a', 'b']);
  });

  test('un rango que las contiene a todas no genera conflicto', () => {
    const orphaned = classesLeftOutside(
      { dayOfWeek: 'monday', closed: false, opensAtMinute: h(14), closesAtMinute: h(22) },
      classes,
    );
    expect(orphaned).toEqual([]);
  });
});
