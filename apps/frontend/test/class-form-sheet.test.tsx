import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render, screen } from '@testing-library/react';
import { ClassFormSheet } from '../src/components/class-schedule/ClassFormSheet';
import { h } from './class-schedule-helpers';

afterEach(cleanup);

const noop = () => undefined;

describe('el formulario de clase (US1, US3)', () => {
  test('propone una hora de duración y deja cambiarla (FR-003)', () => {
    render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={null}
        onSubmit={noop}
        onClose={noop}
      />,
    );
    const start = screen.getByLabelText('Hora de inicio') as HTMLInputElement;
    const end = screen.getByLabelText('Hora de fin') as HTMLInputElement;
    expect(start.value).toBe('17:00');
    expect(end.value).toBe('18:00');
  });

  test('el modo edición precarga los valores de la clase (FR-023)', () => {
    render(
      <ClassFormSheet
        day="tuesday"
        editing={{
          id: 'c1',
          dayOfWeek: 'friday',
          startsAtMinute: h(19),
          endsAtMinute: h(20, 30),
          ageGroup: 'adultos',
          level: 'avanzados',
        }}
        submitting={false}
        error={null}
        onSubmit={noop}
        onClose={noop}
      />,
    );
    expect((screen.getByLabelText('Hora de inicio') as HTMLInputElement).value).toBe('19:00');
    expect((screen.getByLabelText('Hora de fin') as HTMLInputElement).value).toBe('20:30');
    expect((screen.getByLabelText('Franja etaria') as HTMLSelectElement).value).toBe('adultos');
    expect((screen.getByLabelText('Nivel') as HTMLSelectElement).value).toBe('avanzados');
    expect((screen.getByLabelText('Día') as HTMLSelectElement).value).toBe('friday');
  });

  test('sin franja etaria no guarda y explica cuál falta, llevando el foco ahí (FR-011, FR-022a)', async () => {
    let submitted = false;
    render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={null}
        onSubmit={() => {
          submitted = true;
        }}
        onClose={noop}
      />,
    );

    await act(async () => {
      (screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).click();
    });

    expect(submitted).toBe(false);
    expect(screen.getByRole('alert').textContent).toContain('franja etaria');
    expect(document.activeElement).toBe(screen.getByLabelText('Franja etaria'));
  });

  test('sin nivel tampoco guarda, y lo dice (FR-011)', async () => {
    let submitted = false;
    render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={null}
        onSubmit={() => {
          submitted = true;
        }}
        onClose={noop}
      />,
    );

    await act(async () => {
      const age = screen.getByLabelText('Franja etaria') as HTMLSelectElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value',
      )?.set;
      setter?.call(age, 'menores');
      age.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      (screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).click();
    });

    expect(submitted).toBe(false);
    expect(screen.getByRole('alert').textContent).toContain('nivel');
    expect(document.activeElement).toBe(screen.getByLabelText('Nivel'));
  });

  test('un conflicto de solapamiento nombra la clase con la que choca (FR-022)', () => {
    render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={{
          message: 'La clase se solapa con otra del mismo día.',
          conflictingClass: {
            id: 'c9',
            dayOfWeek: 'tuesday',
            startsAtMinute: h(17),
            endsAtMinute: h(18),
            ageGroup: 'adultos',
            level: 'avanzados',
          },
        }}
        onSubmit={noop}
        onClose={noop}
      />,
    );
    const alert = screen.getByRole('alert').textContent ?? '';
    expect(alert).toContain('17:00');
    expect(alert).toContain('Adultos · Avanzados');
  });

  test('cada campo tiene su etiqueta asociada (FR-034)', () => {
    const { container } = render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={null}
        onSubmit={noop}
        onClose={noop}
      />,
    );
    const fields = container.querySelectorAll('input, select');
    expect(fields.length).toBe(5);
    for (const field of fields) {
      const id = field.getAttribute('id');
      expect(id).toBeTruthy();
      expect(container.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });
});
