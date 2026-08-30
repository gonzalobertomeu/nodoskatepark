import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, waitFor } from '@testing-library/react';
import { AppShellInner } from '../src/components/app-shell/AppShell';
import { locateAt, sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

/** Captures where the shell tries to send the browser, without actually navigating. */
function captureNavigation(): { target: () => string | null; restore: () => void } {
  const original = window.location.assign;
  let target: string | null = null;
  window.location.assign = ((url: string) => {
    target = url;
  }) as typeof window.location.assign;
  return {
    target: () => target,
    restore: () => {
      window.location.assign = original;
    },
  };
}

describe('guardas del caparazón', () => {
  test('una sesión expirada o revocada saca del entorno navegable hacia el ingreso (FR-024)', async () => {
    const restore = stubFetch();
    const nav = captureNavigation();
    locateAt('/skaters');

    render(
      withSession(
        {
          status: 'unauthenticated',
          role: null,
          email: null,
          onboardingComplete: null,
          revalidate: async () => undefined,
        },
        <AppShellInner initialPath="/skaters" />,
      ),
    );

    await waitFor(() => expect(nav.target()).toBe('/login'));
    nav.restore();
    restore();
  });

  test('un skater con onboarding incompleto vuelve al paso bloqueante y no recibe la barra (FR-005)', async () => {
    const restore = stubFetch();
    const nav = captureNavigation();
    locateAt('/profile');

    const { container } = render(
      withSession(
        sessionFor('skater', { onboardingComplete: false }),
        <AppShellInner initialPath="/profile" />,
      ),
    );

    await waitFor(() => expect(nav.target()).toBe('/onboarding'));
    expect(container.querySelector('.app-nav')).toBeNull();
    nav.restore();
    restore();
  });

  test('mientras la sesión se resuelve no se dibuja una barra provisional', () => {
    const restore = stubFetch();
    locateAt('/skaters');

    const { container } = render(
      withSession(
        {
          status: 'checking',
          role: null,
          email: null,
          onboardingComplete: null,
          revalidate: async () => undefined,
        },
        <AppShellInner initialPath="/skaters" />,
      ),
    );

    expect(container.querySelector('.app-nav')).toBeNull();
    expect(container.querySelector('.app-skeleton')).not.toBeNull();
    restore();
  });
});
