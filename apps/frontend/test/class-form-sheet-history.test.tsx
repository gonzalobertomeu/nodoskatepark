import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, render } from '@testing-library/react';
import { ClassFormSheet } from '../src/components/class-schedule/ClassFormSheet';

afterEach(cleanup);

/**
 * research.md §8 y 006 FR-022a. La hoja no tiene dirección propia, pero sí apila una entrada de
 * historial: sin ella, "atrás" no tendría nada de la hoja que sacar y saltaría a la entrada
 * anterior, que desde la raíz de un destino significa salir del entorno autenticado — perdiendo el
 * formulario a medio cargar.
 */
describe('el botón "atrás" con la hoja abierta (F1)', () => {
  test('abrir la hoja marca una entrada de historial propia', () => {
    window.history.replaceState({ kind: 'destination' }, '', '/schedule');
    render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={null}
        onSubmit={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(window.history.state?.kind).toBe('sheet');
    expect(window.location.pathname).toBe('/schedule');
  });

  test('un popstate cierra la hoja en lugar de sacar del entorno', async () => {
    window.history.replaceState({ kind: 'destination' }, '', '/schedule');
    let closed = false;
    render(
      <ClassFormSheet
        day="tuesday"
        editing={null}
        submitting={false}
        error={null}
        onSubmit={() => undefined}
        onClose={() => {
          closed = true;
        }}
      />,
    );

    await act(async () => {
      window.dispatchEvent(new Event('popstate'));
    });

    expect(closed).toBe(true);
    expect(window.location.pathname).toBe('/schedule');
  });
});
