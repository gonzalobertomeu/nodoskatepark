import { describe, expect, test } from 'bun:test';
import type { ExecutionContext } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { CurrentSessionResolver } from '../src/modules/class-schedule/domain/ports/current-session-resolver';
import { ClassScheduleAdminOnlyGuard } from '../src/modules/class-schedule/infrastructure/http/class-schedule-admin-only.guard';
import { ClassScheduleStaffGuard } from '../src/modules/class-schedule/infrastructure/http/class-schedule-staff.guard';

/**
 * FR-026, FR-026a, FR-027, SC-007. Hiding an action is presentation; the server is what actually
 * enforces the difference between consulting the grid and configuring it.
 */

type Role = 'skater' | 'instructor' | 'administrador';

function resolverFor(role: Role | null): CurrentSessionResolver {
  return {
    resolve: async () => (role === null ? null : { accountId: 'account-1', role }),
  } as unknown as CurrentSessionResolver;
}

function contextWith(request: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

async function statusOf(promise: Promise<unknown>): Promise<number> {
  try {
    await promise;
    return 200;
  } catch (error) {
    return (error as HttpException).getStatus();
  }
}

describe('lectura del calendario (FR-026a)', () => {
  test('un instructor puede consultar', async () => {
    const request: Record<string, unknown> = {};
    await expect(
      new ClassScheduleStaffGuard(resolverFor('instructor')).canActivate(contextWith(request)),
    ).resolves.toBe(true);
    expect(request.scheduleRole).toBe('instructor');
  });

  test('un administrador puede consultar', async () => {
    await expect(
      new ClassScheduleStaffGuard(resolverFor('administrador')).canActivate(contextWith({})),
    ).resolves.toBe(true);
  });

  test('un skater es rechazado: la aplicación de gestión no es suya', async () => {
    const status = await statusOf(
      new ClassScheduleStaffGuard(resolverFor('skater')).canActivate(contextWith({})),
    );
    expect(status).toBe(HttpStatus.FORBIDDEN);
  });

  test('sin sesión responde no autenticado, no prohibido', async () => {
    const status = await statusOf(
      new ClassScheduleStaffGuard(resolverFor(null)).canActivate(contextWith({})),
    );
    expect(status).toBe(HttpStatus.UNAUTHORIZED);
  });
});

describe('configuración del calendario (FR-026, FR-027)', () => {
  test('solo el administrador puede escribir', async () => {
    await expect(
      new ClassScheduleAdminOnlyGuard(resolverFor('administrador')).canActivate(contextWith({})),
    ).resolves.toBe(true);
  });

  test('un instructor es rechazado aunque la pantalla nunca le haya ofrecido la acción', async () => {
    const status = await statusOf(
      new ClassScheduleAdminOnlyGuard(resolverFor('instructor')).canActivate(contextWith({})),
    );
    expect(status).toBe(HttpStatus.FORBIDDEN);
  });

  test('un skater es rechazado', async () => {
    const status = await statusOf(
      new ClassScheduleAdminOnlyGuard(resolverFor('skater')).canActivate(contextWith({})),
    );
    expect(status).toBe(HttpStatus.FORBIDDEN);
  });
});
