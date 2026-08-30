import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { goToDestination } from '../src/app/router';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('el estado de cada destino sobrevive al cambio (US3, FR-019)', () => {
  test('el panel del destino anterior sigue montado en el DOM tras cambiar (SC-002)', async () => {
    const restore = stubFetch();
    locateAt('/skaters');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />),
    );

    await waitFor(() => expect(container.querySelectorAll('.app-panel').length).toBe(1));

    await act(async () => {
      goToDestination('/staff');
    });

    // Dos paneles vivos: el de Skaters oculto, el de Staff visible. Si el anterior se desmontara,
    // volver descartaría su estado y el techo de 100 ms de FR-020c dejaría de sostenerse.
    await waitFor(() => expect(container.querySelectorAll('.app-panel').length).toBe(2));
    const hidden = container.querySelectorAll('.app-panel[hidden]');
    expect(hidden.length).toBe(1);
    expect(hidden[0]?.textContent).toContain('Skaters');
    restore();
  });

  test('el texto escrito en un listado sigue ahí al volver al destino (SC-002)', async () => {
    const restore = stubFetch();
    locateAt('/skaters');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />),
    );

    const search = await waitFor(() => {
      const input = container.querySelector('.app-panel input') as HTMLInputElement | null;
      if (!input) throw new Error('sin campo de búsqueda');
      return input;
    });

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(search, 'ana');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      goToDestination('/staff');
    });
    await act(async () => {
      goToDestination('/skaters');
    });

    const back = container.querySelector('.app-panel:not([hidden]) input') as HTMLInputElement;
    expect(back.value).toBe('ana');
    restore();
  });

  test('una superficie anidada no descarta el panel de su destino (FR-019, FR-022)', async () => {
    const restore = stubFetch();
    locateAt('/staff');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff" />),
    );

    await act(async () => {
      (screen.getByRole('button', { name: 'Asignar instructor' }) as HTMLButtonElement).click();
    });

    await waitFor(() => expect(window.location.pathname).toBe('/staff/instructors'));
    // El panel de Staff sigue montado, oculto bajo la superficie anidada.
    expect(container.querySelectorAll('.app-panel').length).toBe(2);
    restore();
  });
});
