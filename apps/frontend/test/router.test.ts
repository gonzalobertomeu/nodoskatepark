import { beforeEach, describe, expect, test } from 'bun:test';
import { currentPath, goToDestination, goUp, openNested, subscribe } from '../src/app/router';

function resetTo(path: string): void {
  window.history.replaceState({ kind: 'destination' }, '', path);
}

describe('semántica de historial de la navegación', () => {
  beforeEach(() => {
    resetTo('/skaters');
  });

  test('cambiar de destino reemplaza la entrada de historial (FR-022b)', () => {
    goToDestination('/staff');
    expect(currentPath()).toBe('/staff');
    expect(window.history.state?.kind).toBe('destination');
    // Reemplazó en lugar de apilar: "atrás" no vuelve al destino anterior (FR-022b).
    window.history.back();
    expect(currentPath()).not.toBe('/skaters');
  });

  test('abrir una superficie anidada apila historial (FR-022a)', () => {
    openNested('/staff/instructors');
    expect(currentPath()).toBe('/staff/instructors');
    // La entrada queda marcada como anidada, que es de lo que depende `goUp` para usar el "atrás"
    // del navegador en vez de reemplazar. No se afirma sobre `window.history.length`: es estado
    // global compartido entre archivos de prueba, y cualquier otro que empuje o saque entradas lo
    // vuelve inestable — mide un proxy, no el requisito.
    expect(window.history.state?.kind).toBe('nested');
    window.history.back();
    expect(currentPath()).toBe('/skaters');
  });

  test('subir un nivel devuelve a la raíz del destino (FR-022a)', () => {
    resetTo('/staff/instructors');
    goUp('/staff');
    expect(currentPath()).toBe('/staff');
  });

  test('navegar al destino ya activo no hace nada (FR-006)', () => {
    let notifications = 0;
    const unsubscribe = subscribe(() => {
      notifications += 1;
    });
    goToDestination('/skaters');
    unsubscribe();
    expect(notifications).toBe(0);
    expect(currentPath()).toBe('/skaters');
  });

  test('los suscriptores reciben cada cambio de dirección', () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((path) => seen.push(path));
    goToDestination('/staff');
    openNested('/staff/instructors');
    unsubscribe();
    expect(seen).toEqual(['/staff', '/staff/instructors']);
  });
});
