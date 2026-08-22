import { useEffect, useState } from 'react';
import { skaterProfileClient } from '../services/skater-profile-client';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type SessionState = 'checking' | 'authenticated' | 'unauthenticated' | 'redirecting-onboarding';

/**
 * Placeholder MainApp entry point — the real MainApp is out of scope for this feature
 * (001-user-login-sso only owns getting the user authenticated and landing here).
 *
 * 004-skater-onboarding extends this same session check: a skater whose basic profile
 * (nombre/apellido/fechaDeNacimiento) is incomplete is redirected to /onboarding instead of
 * seeing this placeholder — enforced here, at the MainApp entry point, rather than only at
 * login, so it also covers direct navigation and a second tab catching up (research.md #3).
 */
export function MainAppPlaceholder() {
  const [state, setState] = useState<SessionState>('checking');
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/session`, { credentials: 'include' })
      .then((res) => res.json())
      .then(async (data: { authenticated: boolean; role?: string }) => {
        if (!data.authenticated) {
          setState('unauthenticated');
          return;
        }

        if (data.role === 'skater') {
          try {
            const profile = await skaterProfileClient.getMyBasicInfo();
            if (!profile.complete) {
              setState('redirecting-onboarding');
              return;
            }
          } catch {
            // If the profile check fails, fall through to the MainApp rather than blocking
            // an otherwise-valid session on a transient error.
          }
        }

        setState('authenticated');
        setRole(data.role ?? null);
      })
      .catch(() => setState('unauthenticated'));
  }, []);

  useEffect(() => {
    if (state === 'unauthenticated') {
      window.location.assign('/login');
    } else if (state === 'redirecting-onboarding') {
      window.location.assign('/onboarding');
    }
  }, [state]);

  if (state !== 'authenticated') {
    return <div className="nb-field">Cargando…</div>;
  }

  return (
    <div>
      <p style={{ marginBottom: '1.5rem' }}>
        Sesión iniciada como <strong>{role}</strong>.
      </p>
      {role === 'skater' && (
        <p style={{ marginBottom: '1.5rem' }}>
          <a href="/profile">Editar mis datos</a>
        </p>
      )}
      <button
        type="button"
        className="nb-button"
        onClick={async () => {
          await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
          window.location.assign('/login');
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
