import { afterEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ClassSchedulePanel } from '../src/components/class-schedule/ClassSchedulePanel';
import { currentDayOfWeek } from '../src/components/class-schedule/format';
import { h, scheduleResponse, stubSchedule } from './class-schedule-helpers';
import { sessionFor, withSession } from './helpers';

afterEach(cleanup);

const today = currentDayOfWeek();
const styles = readFileSync(new URL('../src/styles/class-schedule.css', import.meta.url), 'utf-8');

describe('base de accesibilidad de la sección (FR-004a, FR-033, SC-006a)', () => {
  test('cada clase se anuncia con su día, su hora y su categoría en texto', async () => {
    const stub = stubSchedule(
      scheduleResponse({
        classes: [
          {
            id: 'c1',
            dayOfWeek: today,
            startsAtMinute: h(17),
            endsAtMinute: h(18),
            ageGroup: 'adultos',
            level: 'intermedios',
          },
        ],
      }),
    );
    render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => expect(document.querySelector('.cs-class')).not.toBeNull());
    const row = document.querySelector('.cs-class');
    expect(row?.textContent).toContain('17:00 a 18:00');
    // La categoría en palabras: nunca comunicada solo por color (FR-004a).
    expect(row?.textContent).toContain('Adultos · Intermedios');
    stub.restore();
  });

  test('las acciones sobre una clase llevan un nombre accesible que la identifica', async () => {
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

    await waitFor(() => expect(document.querySelector('.cs-class__action')).not.toBeNull());
    const editar = screen.getAllByRole('button', { name: /^Editar la clase de/ });
    const eliminar = screen.getAllByRole('button', { name: /^Eliminar la clase de/ });
    expect(editar.length).toBeGreaterThan(0);
    expect(eliminar.length).toBeGreaterThan(0);
    stub.restore();
  });

  test('toda acción de la sección es un control nativo, alcanzable por teclado', async () => {
    const stub = stubSchedule(scheduleResponse());
    const { container } = render(withSession(sessionFor('administrador'), <ClassSchedulePanel />));

    await waitFor(() => expect(container.querySelector('.cs-day')).not.toBeNull());
    const interactive = container.querySelectorAll('button, a[href], input, select');
    expect(interactive.length).toBeGreaterThan(0);
    for (const el of interactive) {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
    }
    stub.restore();
  });

  test('los controles tienen foco visible y objetivos de 44 px (FR-027, FR-033)', () => {
    expect(styles).toContain(':focus-visible');
    expect(styles).toMatch(/min-height:\s*44px/);
    expect(styles).toMatch(/min-width:\s*44px/);
  });

  test('la sección no se desplaza horizontalmente desde 320 px (FR-029)', () => {
    // El teléfono muestra un día por vez; la cuadrícula de siete columnas solo aparece desde 1024 px.
    expect(styles).toContain('@media (min-width: 1024px)');
    expect(styles).toContain('.cs-week {\n  display: none;\n}');
  });
});
