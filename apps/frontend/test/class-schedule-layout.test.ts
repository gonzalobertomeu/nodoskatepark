import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('../src/styles/class-schedule.css', import.meta.url), 'utf-8');

/**
 * Regression guard for the overflow found in a visual review: on desktop the class card was 163 px
 * inside a 76 px column and spilled over the next day.
 *
 * Three things caused it, and these assertions pin each fix. They check the CSS rules, not the
 * rendered geometry — the real measurement needs a browser, and the numbers above came from one.
 */
describe('la tarjeta de clase no se desborda de su columna', () => {
  test('los hijos flex pueden encogerse por debajo de su contenido', () => {
    // Without min-width: 0 a flex item refuses to shrink below min-content, which is exactly how a
    // card ends up wider than the column holding it.
    expect(styles).toMatch(/\.cs-class \{[^}]*min-width:\s*0/s);
    expect(styles).toMatch(/\.cs-class > \* \{\s*min-width:\s*0/s);
  });

  test('la semana usa el ancho completo del panel, no el de lectura', () => {
    // 006 caps panel content at 48 rem, right for prose and wrong for a seven-day calendar.
    expect(styles).toContain('.app-panel__inner:has(.cs-week)');
    expect(styles).toMatch(/:has\(\.cs-week\) \{\s*max-width:\s*none/s);
  });

  test('en columnas de escritorio la tarjeta y sus acciones apilan en vertical', () => {
    expect(styles).toMatch(/\.cs-week \.cs-class \{[^}]*flex-direction:\s*column/s);
    expect(styles).toMatch(/\.cs-week \.cs-class__actions \{[^}]*flex-direction:\s*column/s);
  });

  test('el selector de día entra entero, sin desplazamiento horizontal', () => {
    // A horizontal scroller pushed the current day off-screen — and the section opens on the
    // current day (FR-001c), so on a Sunday the active day was the one you could not see.
    expect(styles).toMatch(/\.cs-days \{[^}]*grid-template-columns:\s*repeat\(7/s);
    expect(styles).not.toMatch(/\.cs-days \{[^}]*overflow-x:\s*auto/s);
  });
});
