import { describe, expect, test } from 'bun:test';
import { sessionResponseSchema } from '@nodoskatepark/contracts';

/**
 * 006-role-based-bottom-nav extends GET /auth/session with the account's email so the skater's
 * "Configuración" destination can present the account's own data (FR-018a). Backend and contract
 * must not drift: a response without `email` is no longer valid.
 */
describe('contrato de GET /auth/session', () => {
  test('la sesión autenticada incluye rol y email', () => {
    const parsed = sessionResponseSchema.parse({
      authenticated: true,
      role: 'skater',
      email: 'persona@nodoskatepark.test',
    });
    expect(parsed).toEqual({
      authenticated: true,
      role: 'skater',
      email: 'persona@nodoskatepark.test',
    });
  });

  test('una respuesta autenticada sin email deja de ser válida', () => {
    expect(() => sessionResponseSchema.parse({ authenticated: true, role: 'skater' })).toThrow();
  });

  test('la rama no autenticada no cambia', () => {
    expect(sessionResponseSchema.parse({ authenticated: false })).toEqual({ authenticated: false });
  });
});
