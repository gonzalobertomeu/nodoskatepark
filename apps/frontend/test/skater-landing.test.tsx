import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('aterrizaje posterior al ingreso (US1, FR-013)', () => {
  test('el skater llega al primer destino de su rol sin toque adicional ni pantalla intermedia', async () => {
    const restore = stubFetch();
    locateAt('/');
    render(withSession(sessionFor('skater'), <AppShellInner initialPath="/" />));

    await waitFor(() => expect(window.location.pathname).toBe('/bookings'));
    restore();
  });

  test('ese primer destino se presenta en su estado de sección en preparación, no como error (SC-003, FR-025)', async () => {
    const restore = stubFetch();
    locateAt('/bookings');
    render(withSession(sessionFor('skater'), <AppShellInner initialPath="/bookings" />));

    await waitFor(() => expect(screen.getByText('Sección en preparación')).toBeDefined());
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeDefined();
    restore();
  });

  test('el staff aterriza en el primer destino de su propio rol', async () => {
    const restore = stubFetch();
    locateAt('/');
    render(withSession(sessionFor('administrador'), <AppShellInner initialPath="/" />));

    await waitFor(() => expect(window.location.pathname).toBe('/skaters'));
    restore();
  });
});
