import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('destinos todavía no construidos (US4, FR-025, FR-026)', () => {
  test('«Reservar clases» muestra el estado explícito, sin error', async () => {
    const restore = stubFetch();
    locateAt('/bookings');
    const { container } = render(
      withSession(sessionFor('skater'), <AppShellInner initialPath="/bookings" />),
    );

    await waitFor(() => expect(screen.getByText('Sección en preparación')).toBeDefined());
    expect(container.querySelector('.app-state--preparing')).not.toBeNull();
    expect(container.querySelector('.app-state--error')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    restore();
  });

  test('«Horarios de clases» muestra el mismo estado para instructor y administrador', async () => {
    const restore = stubFetch();
    for (const role of ['instructor', 'administrador'] as const) {
      cleanup();
      locateAt('/schedule');
      render(withSession(sessionFor(role), <AppShellInner initialPath="/schedule" />));
      await waitFor(() => expect(screen.getByText('Sección en preparación')).toBeDefined());
    }
    restore();
  });

  test('la barra sigue viva y salir hacia otro destino cuesta un solo toque (FR-026)', async () => {
    const restore = stubFetch();
    locateAt('/bookings');
    const { container } = render(
      withSession(sessionFor('skater'), <AppShellInner initialPath="/bookings" />),
    );

    const links = [...container.querySelectorAll('.app-nav__link')] as HTMLAnchorElement[];
    expect(links.length).toBe(3);

    await act(async () => {
      const settings = links.find((link) => link.textContent?.includes('Configuración'));
      settings?.click();
    });

    await waitFor(() => expect(window.location.pathname).toBe('/settings'));
    restore();
  });

  test('ningún destino de ningún rol produce un error al abrirlo (SC-008)', async () => {
    const restore = stubFetch();
    const paths: [Parameters<typeof sessionFor>[0], string][] = [
      ['skater', '/bookings'],
      ['skater', '/profile'],
      ['skater', '/settings'],
      ['instructor', '/skaters'],
      ['instructor', '/schedule'],
      ['administrador', '/skaters'],
      ['administrador', '/staff'],
      ['administrador', '/schedule'],
    ];

    for (const [role, path] of paths) {
      cleanup();
      locateAt(path);
      const { container } = render(
        withSession(sessionFor(role), <AppShellInner initialPath={path} />),
      );
      await waitFor(() =>
        expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeDefined(),
      );
      expect(container.querySelector('.app-state--error')).toBeNull();
      expect(window.location.pathname).toBe(path);
    }
    restore();
  });
});
