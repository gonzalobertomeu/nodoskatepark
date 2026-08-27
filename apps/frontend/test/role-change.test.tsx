import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('cambio de rol con la sesión activa (US2, FR-014, FR-014a)', () => {
  test('degradar a instructor mientras se ve el listado de staff lleva al primer destino del rol nuevo, con explicación', async () => {
    const restore = stubFetch();

    // La sesión ya es de administrador y la persona está en /staff.
    locateAt('/staff');
    const { rerender } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff" />),
    );
    expect(window.location.pathname).toBe('/staff');

    // Su rol pasa a instructor y la siguiente interacción con el servidor lo refleja.
    rerender(withSession(sessionFor('instructor'), <AppShellInner initialPath="/staff" />));

    await waitFor(() => expect(window.location.pathname).toBe('/skaters'));
    // No se cierra su sesión ni se deja la sección perdida en pantalla: se explica el motivo.
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('rol cambió'));
    restore();
  });

  test('la barra se recompone con los destinos del rol nuevo, sin cierre de sesión manual (FR-014)', async () => {
    const restore = stubFetch();

    locateAt('/skaters');
    const { rerender } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />),
    );
    let nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav.textContent).toContain('Staff');

    rerender(withSession(sessionFor('instructor'), <AppShellInner initialPath="/skaters" />));

    await waitFor(() => {
      nav = screen.getByRole('navigation', { name: 'Navegación principal' });
      expect(nav.textContent).not.toContain('Staff');
    });
    expect(window.location.pathname).toBe('/skaters');
    restore();
  });
});
