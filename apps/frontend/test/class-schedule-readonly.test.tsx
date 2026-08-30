import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ClassSchedulePanel } from '../src/components/class-schedule/ClassSchedulePanel';
import { currentDayOfWeek } from '../src/components/class-schedule/format';
import { h, scheduleResponse, stubSchedule } from './class-schedule-helpers';
import { sessionFor, withSession } from './helpers';

afterEach(cleanup);

const today = currentDayOfWeek();

const withOneClass = () =>
  scheduleResponse({
    classes: [
      {
        id: 'c1',
        dayOfWeek: today,
        startsAtMinute: h(17),
        endsAtMinute: h(18),
        ageGroup: 'menores',
        level: 'iniciantes',
      },
    ],
    hours: [{ dayOfWeek: today, closed: false, opensAtMinute: h(14), closesAtMinute: h(22) }],
  });

describe('el instructor consulta sin modificar (US4, FR-026a, FR-028)', () => {
  test('ve la grilla completa, con horario y categoría', async () => {
    const stub = stubSchedule(withOneClass());
    render(withSession(sessionFor('instructor'), <ClassSchedulePanel />));

    await waitFor(() => expect(screen.getAllByText('17:00 a 18:00').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Menores · Iniciantes').length).toBeGreaterThan(0);
    expect(document.querySelector('.cs-hours')?.textContent).toContain('14:00 a 22:00');
    stub.restore();
  });

  test('no encuentra ninguna acción de modificación (FR-028)', async () => {
    const stub = stubSchedule(withOneClass());
    render(withSession(sessionFor('instructor'), <ClassSchedulePanel />));

    await waitFor(() => expect(screen.getAllByText('17:00 a 18:00').length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: 'Nueva clase' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Horario del skatepark' })).toBeNull();
    expect(document.querySelectorAll('.cs-class__action').length).toBe(0);
    stub.restore();
  });

  test('el administrador sí las encuentra: la diferencia es de rol, no de pantalla', async () => {
    const stub = stubSchedule(withOneClass());
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Nueva clase' })).toBeDefined());
    expect(screen.getByRole('button', { name: 'Horario del skatepark' })).toBeDefined();
    expect(document.querySelectorAll('.cs-class__action').length).toBeGreaterThan(0);
    stub.restore();
  });
});
