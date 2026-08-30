import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { destinationsFor, ROLE_DESTINATIONS } from '../src/app/navigation-map';

const styles = readFileSync(new URL('../src/styles/app-shell.css', import.meta.url), 'utf-8');

/**
 * US5 / FR-030 / FR-031 / SC-007: tablet and desktop get the same destinations, in the same order,
 * at the same depth. That is guaranteed structurally rather than by comparing two renders: bar and
 * rail are the same component fed by the same map, so only the layout can differ.
 */
describe('la misma navegación en pantallas grandes (US5)', () => {
  test('el riel se obtiene re-presentando la misma barra, no con un componente aparte', () => {
    const nav = readFileSync(
      new URL('../src/components/app-shell/BottomNav.tsx', import.meta.url),
      'utf-8',
    );
    // Un único origen de los destinos: la prop que recibe del caparazón.
    expect(nav).toContain('destinations.map');
    // Y una única consulta de medios que cambia la disposición, sin tocar el conjunto.
    expect(styles).toContain('@media (min-width: 1024px)');
    expect(styles).toContain('.app-nav__list');
  });

  test('el conjunto y el orden de destinos no dependen del ancho: salen del mismo mapa (SC-007)', () => {
    for (const role of ['skater', 'instructor', 'administrador'] as const) {
      expect(destinationsFor(role)).toBe(ROLE_DESTINATIONS[role]);
    }
  });

  test('ninguna sección se desplaza horizontalmente: los paneles solo desbordan en vertical (FR-029, SC-006)', () => {
    expect(styles).toContain('overflow-x: hidden');
    expect(styles).toContain('overflow-y: auto');
  });

  test('los objetivos táctiles de la barra llegan a 44 px (FR-027)', () => {
    expect(styles).toMatch(/min-height:\s*(4[4-9]|[5-9]\d)px/);
    expect(styles).toMatch(/min-width:\s*44px/);
  });

  test('la barra respeta las áreas seguras del dispositivo (FR-028)', () => {
    expect(styles).toContain('env(safe-area-inset-bottom');
  });
});
