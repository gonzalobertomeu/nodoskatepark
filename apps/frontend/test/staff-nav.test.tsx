import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

function labelsFor(role: 'instructor' | 'administrador', path: string): (string | null)[] {
  locateAt(path);
  render(withSession(sessionFor(role), <AppShellInner initialPath={path} />));
  const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
  return [...nav.querySelectorAll('.app-nav__label')].map((node) => node.textContent);
}

describe('la barra del staff (US2)', () => {
  test('el administrador ve sus tres destinos de gestión, en orden (FR-009, FR-002a)', () => {
    const restore = stubFetch();
    expect(labelsFor('administrador', '/skaters')).toEqual([
      'Skaters',
      'Staff',
      'Horarios de clases',
    ]);
    restore();
  });

  test('el instructor ve dos destinos y nunca el listado de staff (FR-010, SC-005)', () => {
    const restore = stubFetch();
    const labels = labelsFor('instructor', '/skaters');
    expect(labels).toEqual(['Skaters', 'Horarios de clases']);
    expect(labels).not.toContain('Staff');
    restore();
  });

  test('ninguna cuenta de staff ve destinos propios de skater (FR-011)', () => {
    const restore = stubFetch();
    for (const role of ['instructor', 'administrador'] as const) {
      cleanup();
      const labels = labelsFor(role, '/skaters');
      expect(labels).not.toContain('Mi perfil');
      expect(labels).not.toContain('Configuración');
      expect(labels).not.toContain('Reservar clases');
    }
    restore();
  });

  test('la cuenta propia vive en el encabezado, no en la barra (FR-016, FR-017)', () => {
    const restore = stubFetch();
    locateAt('/skaters');
    render(withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />));

    const account = screen.getByRole('button', { name: 'Mi cuenta' });
    expect(account).toBeDefined();
    // El elemento de cuenta está fuera de la barra inferior.
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav.contains(account)).toBe(false);
    restore();
  });

  test('un instructor en una dirección exclusiva de administrador es llevado a su primer destino (FR-011, FR-014a)', () => {
    const restore = stubFetch();
    locateAt('/staff');
    render(withSession(sessionFor('instructor'), <AppShellInner initialPath="/staff" />));

    expect(window.location.pathname).toBe('/skaters');
    restore();
  });
});
