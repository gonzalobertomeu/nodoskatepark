import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

function typeInto(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('tocar el destino ya activo (US3, FR-006)', () => {
  test('no reinicia ni vacía el estado de esa sección', async () => {
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
    await act(async () => typeInto(search, 'ana'));

    const activeLink = container.querySelector(
      '.app-nav__link[aria-current="page"]',
    ) as HTMLAnchorElement;
    expect(activeLink.textContent).toContain('Skaters');

    await act(async () => {
      activeLink.click();
    });

    const after = container.querySelector('.app-panel:not([hidden]) input') as HTMLInputElement;
    expect(after.value).toBe('ana');
    expect(window.location.pathname).toBe('/skaters');
    // Sigue habiendo un único panel: tocar el destino activo no montó nada nuevo.
    expect(container.querySelectorAll('.app-panel').length).toBe(1);
    restore();
  });

  test('el toque en el destino activo no provoca navegación de documento (FR-020)', async () => {
    const restore = stubFetch();
    locateAt('/staff');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff" />),
    );

    const activeLink = container.querySelector(
      '.app-nav__link[aria-current="page"]',
    ) as HTMLAnchorElement;

    // Se escucha en document: React 18 delega en la raíz del contenedor, así que un listener en
    // el propio enlace correría antes que el manejador de React y no vería el preventDefault.
    let defaultPrevented = false;
    const observe = (event: Event) => {
      defaultPrevented = event.defaultPrevented;
    };
    document.addEventListener('click', observe);
    await act(async () => {
      activeLink.click();
    });
    document.removeEventListener('click', observe);

    expect(defaultPrevented).toBe(true);
    restore();
  });
});
