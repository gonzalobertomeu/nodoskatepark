import { describe, expect, test } from 'bun:test';
import type { ExecutionContext } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { CurrentSessionResolver } from '../src/modules/staff-directory/domain/ports/current-session-resolver';
import { StaffDirectoryAdminOnlyGuard } from '../src/modules/staff-directory/infrastructure/http/staff-directory-admin-only.guard';

/**
 * 006-role-based-bottom-nav, FR-012: hiding a destination is a presentation decision and never the
 * access control. The bar never offers the staff listing to an instructor or a skater — and the
 * server must keep rejecting them anyway, however the address is reached.
 *
 * This asserts the guard 005-staff-directory already owns; nothing here changes it. The point is
 * that the navigation feature does not become the only thing standing between a role and a
 * section it may not use.
 */

type Role = 'skater' | 'instructor' | 'administrador';

function guardFor(role: Role | null): StaffDirectoryAdminOnlyGuard {
  const resolver = {
    resolve: async () => (role === null ? null : { accountId: 'account-1', role }),
  } as unknown as CurrentSessionResolver;
  return new StaffDirectoryAdminOnlyGuard(resolver);
}

function contextWith(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('acceso al listado de staff (FR-012, SC-005)', () => {
  test('un instructor es rechazado aunque la barra nunca le haya ofrecido el destino', async () => {
    const promise = guardFor('instructor').canActivate(contextWith({}));
    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((error: HttpException) => {
      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });

  test('un skater es rechazado al intentar alcanzar una sección exclusiva de staff', async () => {
    const promise = guardFor('skater').canActivate(contextWith({}));
    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((error: HttpException) => {
      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });

  test('sin sesión se responde no autenticado, no prohibido', async () => {
    const promise = guardFor(null).canActivate(contextWith({}));
    await promise.catch((error: HttpException) => {
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  test('un administrador pasa y su cuenta queda disponible para el controlador', async () => {
    const request: Record<string, unknown> = {};
    await expect(guardFor('administrador').canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.adminAccountId).toBe('account-1');
  });
});
