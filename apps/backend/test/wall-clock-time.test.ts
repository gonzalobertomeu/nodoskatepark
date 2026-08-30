import { describe, expect, test } from 'bun:test';
import { scheduledClassSchema } from '@nodoskatepark/contracts';
import { isValidRange } from '../src/modules/class-schedule/domain/services/schedule-rules';

/**
 * FR-018a: every hour is the skatepark's local wall-clock time. It holds by construction, not by
 * discipline — an integer count of minutes has no timezone to convert, so there is no point in the
 * system where anyone could shift it by accident.
 */
describe('la hora no se mueve nunca (FR-018a)', () => {
  test('el contrato transporta enteros de minutos, no cadenas ni fechas', () => {
    const parsed = scheduledClassSchema.parse({
      id: 'c1',
      dayOfWeek: 'tuesday',
      startsAtMinute: 1020,
      endsAtMinute: 1080,
      ageGroup: 'menores',
      level: 'iniciantes',
    });
    expect(typeof parsed.startsAtMinute).toBe('number');

    // Una cadena "17:00" o una fecha ISO no son válidas: el tipo lo impide en el borde.
    expect(() =>
      scheduledClassSchema.parse({
        id: 'c1',
        dayOfWeek: 'tuesday',
        startsAtMinute: '17:00',
        endsAtMinute: 1080,
        ageGroup: 'menores',
        level: 'iniciantes',
      }),
    ).toThrow();
    expect(() =>
      scheduledClassSchema.parse({
        id: 'c1',
        dayOfWeek: 'tuesday',
        startsAtMinute: new Date().toISOString(),
        endsAtMinute: 1080,
        ageGroup: 'menores',
        level: 'iniciantes',
      }),
    ).toThrow();
  });

  test('la validación no depende de la zona horaria del proceso', () => {
    const original = process.env.TZ;
    const results: boolean[] = [];
    for (const tz of ['UTC', 'America/Argentina/Buenos_Aires', 'Asia/Tokyo']) {
      process.env.TZ = tz;
      results.push(isValidRange(1020, 1080));
    }
    process.env.TZ = original;
    expect(results).toEqual([true, true, true]);
  });
});
