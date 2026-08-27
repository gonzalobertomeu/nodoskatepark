import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { goToDestination, openNested } from '../src/app/router';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('base de accesibilidad de la navegación (FR-027a a FR-027c, SC-006a)', () => {
  test('la barra se expone como navegación con nombre accesible (FR-027a)', () => {
    const restore = stubFetch();
    locateAt('/skaters');
    render(withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />));

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeDefined();
    restore();
  });

  test('el destino activo se anuncia con aria-current, no solo por color (FR-027a)', async () => {
    const restore = stubFetch();
    locateAt('/skaters');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />),
    );

    expect(container.querySelectorAll('[aria-current="page"]').length).toBe(1);

    await act(async () => {
      goToDestination('/staff');
    });

    await waitFor(() => {
      const current = container.querySelector('[aria-current="page"]');
      expect(current?.textContent).toContain('Staff');
    });
    restore();
  });

  test('todos los destinos son enlaces reales, alcanzables y activables por teclado (FR-027b)', () => {
    const restore = stubFetch();
    locateAt('/skaters');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />),
    );

    const links = [...container.querySelectorAll('.app-nav__link')];
    expect(links.length).toBe(3);
    for (const link of links) {
      // Un <a href> entra en el orden de tabulación y se activa con Enter sin trabajo extra; el
      // mismo marcado sirve para la barra y para el riel de escritorio (FR-030).
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBeTruthy();
      expect(link.hasAttribute('tabindex')).toBe(false);
    }
    restore();
  });

  test('el foco pasa al encabezado de la sección nueva al cambiar de destino (FR-027c)', async () => {
    const restore = stubFetch();
    locateAt('/skaters');
    render(withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />));

    await act(async () => {
      goToDestination('/staff');
    });

    await waitFor(() => {
      const focused = document.activeElement as HTMLElement;
      expect(focused.tagName).toBe('H1');
      expect(focused.textContent).toBe('Staff');
    });
    restore();
  });

  test('el foco también se traslada al subir un nivel (FR-027c)', async () => {
    const restore = stubFetch();
    locateAt('/staff');
    render(withSession(sessionFor('administrador'), <AppShellInner initialPath="/staff" />));

    await act(async () => {
      openNested('/staff/instructors');
    });
    await waitFor(() => {
      const focused = document.activeElement as HTMLElement;
      expect(focused.textContent).toBe('Asignar instructor');
    });

    await act(async () => {
      (screen.getByRole('button', { name: 'Volver' }) as HTMLButtonElement).click();
      // La superficie anidada fue apilada, así que "volver" usa history.back(). happy-dom cambia
      // la dirección pero no emite popstate, que es lo que un navegador real sí hace; se emite
      // aquí para ejercitar el mismo camino que en producción.
      window.dispatchEvent(new Event('popstate'));
    });
    await waitFor(() => {
      expect(window.location.pathname).toBe('/staff');
      const focused = document.activeElement as HTMLElement;
      expect(focused.textContent).toBe('Staff');
    });
    restore();
  });

  test('el encabezado de cada sección es enfocable programáticamente y no por tabulación', () => {
    const restore = stubFetch();
    locateAt('/skaters');
    const { container } = render(
      withSession(sessionFor('administrador'), <AppShellInner initialPath="/skaters" />),
    );

    const heading = container.querySelector('.app-section-header__title') as HTMLElement;
    expect(heading.getAttribute('tabindex')).toBe('-1');
    restore();
  });
});
