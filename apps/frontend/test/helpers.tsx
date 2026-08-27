import type { AccountRole } from '@nodoskatepark/contracts';
import type { ReactNode } from 'react';
import { SessionContextProvider, type SessionContextValue } from '../src/app/session-context';

/** A fixed, authenticated session so component tests never touch the network. */
export function sessionFor(
  role: AccountRole,
  overrides: Partial<SessionContextValue> = {},
): SessionContextValue {
  return {
    status: 'authenticated',
    role,
    email: 'persona@nodoskatepark.test',
    onboardingComplete: role === 'skater' ? true : null,
    revalidate: async () => undefined,
    ...overrides,
  };
}

export function withSession(session: SessionContextValue, children: ReactNode) {
  return <SessionContextProvider value={session}>{children}</SessionContextProvider>;
}

/**
 * Stubs every request the adopted views make on mount, so a navigation test exercises the shell
 * and not 002/004/005's data layers. Returns a restore function.
 */
export function stubFetch(handler?: (url: string) => unknown): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const body = handler?.(url) ?? defaultBody(url);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function defaultBody(url: string): unknown {
  if (url.includes('/skater-profile/me')) {
    return { nombre: 'Ana', apellido: 'Pérez', fechaDeNacimiento: '2005-04-01', complete: true };
  }
  if (url.includes('/skater-directory')) {
    return { items: [], total: 0, page: 1, pageSize: 50 };
  }
  if (url.includes('/staff-directory')) {
    return { items: [] };
  }
  if (url.includes('/instructor-assignment')) {
    return { items: [] };
  }
  return {};
}

/** Puts the document at a given address before rendering the shell. */
export function locateAt(path: string): void {
  window.history.replaceState({ kind: 'destination' }, '', path);
}
