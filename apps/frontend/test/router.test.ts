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
    const lengthBefore = window.history.length;
    goToDestination('/staff');
    expect(currentPath()).toBe('/staff');
    expect(window.history.length).toBe(lengthBefore);
    expect(window.history.state?.kind).toBe('destination');
  });

  test('abrir una superficie anidada apila historial (FR-022a)', () => {
    const lengthBefore = window.history.length;
    openNested('/staff/instructors');
    expect(currentPath()).toBe('/staff/instructors');
    expect(window.history.length).toBe(lengthBefore + 1);
    expect(window.history.state?.kind).toBe('nested');
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
