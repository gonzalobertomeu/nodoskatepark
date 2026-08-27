import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('superficies anidadas bajo su destino (US2, FR-022)', () => {
  test('la asignación de instructor se alcanza en un toque desde la raíz del destino Staff (FR-021)', async () => {
    const restore = stubFetch();
    locateAt('/staff');
    render(withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff" />));

    (screen.getByRole('button', { name: 'Asignar instructor' }) as HTMLButtonElement).click();

    await waitFor(() => expect(window.location.pathname).toBe('/staff/instructors'));
    restore();
  });

  test('el destino padre sigue marcado activo mientras se ve la superficie anidada (FR-020a)', async () => {
    const restore = stubFetch();
    locateAt('/staff/instructors');
    render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff/instructors" />),
    );

    await waitFor(() => {
      const current = screen
        .getByRole('navigation', { name: 'Navegación principal' })
        .querySelector('[aria-current="page"]');
      expect(current?.textContent).toContain('Staff');
    });
    restore();
  });

  test('la flecha en pantalla devuelve a la raíz del destino (FR-022, FR-022a)', async () => {
    const restore = stubFetch();
    locateAt('/staff/instructors');
    render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff/instructors" />),
    );

    (screen.getByRole('button', { name: 'Volver' }) as HTMLButtonElement).click();

    await waitFor(() => expect(window.location.pathname).toBe('/staff'));
    restore();
  });

  test('el perfil individual de un skater se anida bajo el destino Skaters (FR-022)', async () => {
    const restore = stubFetch();
    locateAt('/skaters/profile');
    render(withSession(sessionFor('instructor'), <AppShellInner initialPath="/skaters/profile" />));

    await waitFor(() => {
      const current = screen
        .getByRole('navigation', { name: 'Navegación principal' })
        .querySelector('[aria-current="page"]');
      expect(current?.textContent).toContain('Skaters');
    });
    restore();
  });
});
