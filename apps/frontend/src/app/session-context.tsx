import type { AccountRole } from '@nodoskatepark/contracts';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { authClient } from '../services/auth-client';
import { skaterProfileClient } from '../services/skater-profile-client';

/**
 * Session state of the authenticated shell (006-role-based-bottom-nav).
 *
 * The role is revalidated on every destination change and whenever a destination reports an
 * authorization failure — never on a timer. FR-014 fixes that moment ("the next server
 * interaction") and rules out polling and pushed notifications alike.
 */

export type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  status: SessionStatus;
  role: AccountRole | null;
  email: string | null;
  /** null while unknown or not applicable (staff accounts have no onboarding step). */
  onboardingComplete: boolean | null;
}

export interface SessionContextValue extends SessionState {
  /** Re-reads GET /auth/session. Call on every destination change (FR-014). */
  revalidate: () => Promise<void>;
}

const initialState: SessionState = {
  status: 'checking',
  role: null,
  email: null,
  onboardingComplete: null,
};

const SessionContext = createContext<SessionContextValue>({
  ...initialState,
  revalidate: async () => undefined,
});

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);

  const load = useCallback(async () => {
    let result: Awaited<ReturnType<typeof authClient.session>>;
    try {
      result = await authClient.session();
    } catch {
      // A network error is not proof the session is gone; keep whatever we already knew rather
      // than throwing the person out of the application (FR-024a covers the visible side).
      setState((previous) =>
        previous.status === 'checking' ? { ...previous, status: 'unauthenticated' } : previous,
      );
      return;
    }

    if (!result.authenticated) {
      setState({ status: 'unauthenticated', role: null, email: null, onboardingComplete: null });
      return;
    }

    // 004-skater-onboarding stays a blocking step ahead of this navigation: a skater with an
    // incomplete profile never gets the bar (FR-005).
    let onboardingComplete: boolean | null = null;
    if (result.role === 'skater') {
      try {
        onboardingComplete = (await skaterProfileClient.getMyBasicInfo()).complete;
      } catch {
        // Same reasoning as MainAppPlaceholder had: a transient profile-check failure must not
        // block an otherwise valid session.
        onboardingComplete = true;
      }
    }

    setState({
      status: 'authenticated',
      role: result.role,
      email: result.email,
      onboardingComplete,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SessionContext.Provider value={{ ...state, revalidate: load }}>
      {children}
    </SessionContext.Provider>
  );
}

/** Test seam: render a subtree with a fixed session instead of hitting the network. */
export function SessionContextProvider({
  value,
  children,
}: {
  value: SessionContextValue;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
