import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { SectionError } from '../src/components/app-shell/SectionError';

afterEach(cleanup);

function Exploding(): never {
  throw new Error('fallo de datos simulado');
}

describe('fallo de datos dentro del destino (FR-024a, FR-024b, SC-010)', () => {
  test('el error se muestra dentro del destino, con reintento, sin reemplazar la aplicación', () => {
    const original = console.error;
    console.error = () => undefined;

    const { container } = render(
      <div className="app-shell">
        <div className="app-shell__panels">
          <section className="app-panel">
            <SectionError resetKey="skaters">
              <Exploding />
            </SectionError>
          </section>
        </div>
        <nav aria-label="Navegación principal">
          <a href="/staff">Staff</a>
        </nav>
      </div>,
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDefined();
    // La barra sigue presente y permite cambiar de destino con un solo toque.
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeDefined();
    // El error vive dentro del panel, no en lugar de la aplicación.
    expect(container.querySelector('.app-panel [role="alert"]')).not.toBeNull();

    console.error = original;
  });

  test('el estado de error no se confunde con el de sección en preparación (FR-024b)', () => {
    const original = console.error;
    console.error = () => undefined;

    const { container } = render(
      <SectionError resetKey="skaters">
        <Exploding />
      </SectionError>,
    );

    expect(container.querySelector('.app-state--error')).not.toBeNull();
    expect(container.querySelector('.app-state--preparing')).toBeNull();
    expect(container.textContent).not.toContain('Sección en preparación');

    console.error = original;
  });
});
