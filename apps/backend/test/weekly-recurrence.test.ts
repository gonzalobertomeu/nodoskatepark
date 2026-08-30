import { describe, expect, test } from 'bun:test';
import { scheduledClassSchema } from '@nodoskatepark/contracts';

/**
 * FR-007, FR-025a, SC-006. A weekly class carries a weekday and no date at all, which is what makes
 * two things true at once: it recurs every week without anyone reloading it, and "what did the grid
 * look like three months ago" has no answer by design.
 */
describe('recurrencia semanal por construcción (FR-007, FR-025a)', () => {
  const shape = scheduledClassSchema.shape;

  test('una clase se ubica por día de la semana, no por fecha', () => {
    expect(Object.keys(shape).sort()).toEqual([
      'ageGroup',
      'dayOfWeek',
      'endsAtMinute',
      'id',
      'level',
      'startsAtMinute',
    ]);
  });

  test('no existe ningún campo de fecha ni de vigencia', () => {
    const forbidden = ['date', 'fecha', 'validFrom', 'validUntil', 'effectiveFrom', 'occurredOn'];
    for (const field of forbidden) {
      expect(Object.keys(shape)).not.toContain(field);
    }
  });

  test('un campo de fecha extra se descarta: la forma es cerrada', () => {
    const parsed = scheduledClassSchema.parse({
      id: 'c1',
      dayOfWeek: 'tuesday',
      startsAtMinute: 1020,
      endsAtMinute: 1080,
      ageGroup: 'menores',
      level: 'iniciantes',
      date: '2026-08-28',
    });
    expect(parsed).not.toHaveProperty('date');
  });
});
