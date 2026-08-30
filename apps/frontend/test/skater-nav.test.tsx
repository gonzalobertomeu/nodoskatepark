import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('la barra del skater (US1)', () => {
  test('muestra exactamente sus tres destinos, en orden y con sus etiquetas literales (FR-008, FR-002a)', () => {
    const restore = stubFetch();
    locateAt('/profile');
    render(withSession(sessionFor('skater'), <AppShellInner initialPath="/profile" />));

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    const labels = [...nav.querySelectorAll('.app-nav__label')].map((node) => node.textContent);
    expect(labels).toEqual(['Reservar clases', 'Mi perfil', 'Configuración']);
    restore();
  });

  test('marca el destino activo de forma anunciable, no solo visual (FR-003, FR-027a)', () => {
    const restore = stubFetch();
    locateAt('/settings');
    render(withSession(sessionFor('skater'), <AppShellInner initialPath="/settings" />));

    const current = screen
      .getByRole('navigation', { name: 'Navegación principal' })
      .querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain('Configuración');
    restore();
  });

  test('no ofrece ningún destino de staff (FR-011)', () => {
    const restore = stubFetch();
    locateAt('/profile');
    render(withSession(sessionFor('skater'), <AppShellInner initialPath="/profile" />));

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav.textContent).not.toContain('Staff');
    expect(nav.textContent).not.toContain('Skaters');
    restore();
  });

  test('cada destino conserva una dirección propia y compartible (FR-020a)', () => {
    const restore = stubFetch();
    locateAt('/profile');
    render(withSession(sessionFor('skater'), <AppShellInner initialPath="/profile" />));

    const hrefs = [
      ...screen
        .getByRole('navigation', { name: 'Navegación principal' })
        .querySelectorAll('a[href]'),
    ].map((node) => node.getAttribute('href'));
    expect(hrefs).toEqual(['/bookings', '/profile', '/settings']);
    restore();
  });
});
