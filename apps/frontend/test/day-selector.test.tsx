import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render, screen } from '@testing-library/react';
import { DaySelector } from '../src/components/class-schedule/DaySelector';

afterEach(cleanup);

describe('el selector de día (US1, FR-001a, FR-033)', () => {
  test('los siete días son botones alcanzables por teclado', () => {
    render(<DaySelector selected="tuesday" onSelect={() => undefined} />);
    const days = screen.getAllByRole('button');
    expect(days.length).toBe(7);
    for (const day of days) {
      // Un botón entra en el orden de tabulación por sí solo; no se le fuerza tabindex.
      expect(day.hasAttribute('tabindex')).toBe(false);
    }
  });

  test('solo un día lleva aria-pressed, y es el activo (FR-033)', () => {
    const { container } = render(<DaySelector selected="thursday" onSelect={() => undefined} />);
    const pressed = container.querySelectorAll('[aria-pressed="true"]');
    expect(pressed.length).toBe(1);
    expect(pressed[0]?.textContent).toBe('Jue');
  });

  test('cambiar de día cuesta un solo toque', async () => {
    const seen: string[] = [];
    render(<DaySelector selected="monday" onSelect={(day) => seen.push(day)} />);

    await act(async () => {
      (screen.getByText('Sáb') as HTMLButtonElement).click();
    });

    expect(seen).toEqual(['saturday']);
  });

  test('el grupo tiene nombre accesible, desde un fieldset nativo', () => {
    const { container } = render(<DaySelector selected="monday" onSelect={() => undefined} />);
    const group = container.querySelector('fieldset');
    expect(group).not.toBeNull();
    expect(group?.querySelector('legend')?.textContent).toBe('Día de la semana');
  });
});
