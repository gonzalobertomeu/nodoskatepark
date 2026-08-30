import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ClassSchedulePanel } from '../src/components/class-schedule/ClassSchedulePanel';
import { currentDayOfWeek } from '../src/components/class-schedule/format';
import { h, scheduleResponse, stubSchedule } from './class-schedule-helpers';
import { sessionFor, withSession } from './helpers';

afterEach(cleanup);

const today = currentDayOfWeek();

describe('el destino Horarios de clases (US1)', () => {
  test('arranca en el día actual (FR-001c)', async () => {
    const stub = stubSchedule(scheduleResponse());
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => {
      const pressed = document.querySelector('.cs-day[aria-pressed="true"]');
      expect(pressed).not.toBeNull();
    });
    const days = [...document.querySelectorAll('.cs-day')];
    const pressedIndex = days.findIndex((d) => d.getAttribute('aria-pressed') === 'true');
    const expected = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ].indexOf(today);
    expect(pressedIndex).toBe(expected);
    stub.restore();
  });

  test('muestra un estado explícito cuando el día no tiene clases, nunca una pantalla vacía (FR-005)', async () => {
    const stub = stubSchedule(scheduleResponse());
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => expect(document.querySelector('.cs-empty')).not.toBeNull());
    expect(document.querySelector('.cs-empty')?.textContent).toContain('No hay clases este día');
    stub.restore();
  });

  test('lista las clases del día con su horario y su categoría en texto (FR-004, FR-004a)', async () => {
    const stub = stubSchedule(
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
      }),
    );
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => expect(screen.getAllByText('17:00 a 18:00').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Menores · Iniciantes').length).toBeGreaterThan(0);
    stub.restore();
  });

  test('distingue los tres estados del horario: sin configurar, cerrado y abierto (FR-018, FR-015a)', async () => {
    const unset = stubSchedule(scheduleResponse());
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));
    await waitFor(() =>
      expect(document.querySelector('.cs-hours')?.textContent).toContain(
        'todavía no está definido',
      ),
    );
    unset.restore();
    cleanup();

    const closed = stubSchedule(
      scheduleResponse({
        hours: [{ dayOfWeek: today, closed: true, opensAtMinute: null, closesAtMinute: null }],
      }),
    );
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));
    await waitFor(() =>
      expect(document.querySelector('.cs-hours')?.textContent).toContain('no abre'),
    );
    closed.restore();
    cleanup();

    const open = stubSchedule(
      scheduleResponse({
        hours: [{ dayOfWeek: today, closed: false, opensAtMinute: h(14), closesAtMinute: h(22) }],
      }),
    );
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));
    await waitFor(() =>
      expect(document.querySelector('.cs-hours')?.textContent).toContain('14:00 a 22:00'),
    );
    open.restore();
  });

  test('trae la grilla y los horarios en una sola lectura (research.md §6)', async () => {
    const stub = stubSchedule(scheduleResponse());
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => expect(document.querySelector('.cs-hours')).not.toBeNull());
    expect(stub.calls.filter((c) => c.method === 'GET').length).toBe(1);
    stub.restore();
  });
});
