import { useEffect, useRef, useState } from 'react';
import { leaveApp } from '../../app/router';
import { useSession } from '../../app/session-context';
import { authClient } from '../../services/auth-client';

const ROLE_LABEL: Record<string, string> = {
  instructor: 'Instructor',
  administrador: 'Administrador',
};

/**
 * The persistent account element in every staff section's header (FR-016).
 *
 * Staff bars carry management destinations only, so the account itself lives here instead of
 * taking a first-level destination. It is strictly limited to the account's own data and signing
 * out: it MUST NOT hold navigation between sections, which stays the bottom bar's job (FR-017).
 */
export function AccountMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function close(event: Event): void {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  async function signOut(): Promise<void> {
    setSigningOut(true);
    try {
      await authClient.logout();
    } catch {
      // The local session is of no further use either way; leaving for the login screen is the
      // honest outcome.
    }
    leaveApp('/login');
  }

  const initial = session.email?.slice(0, 1).toUpperCase() ?? '·';

  return (
    <div className="app-account" ref={container}>
      <button
        type="button"
        className="app-account__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Mi cuenta"
        onClick={() => setOpen((previous) => !previous)}
      >
        {initial}
      </button>
      {open ? (
        <div className="app-account__sheet" role="dialog" aria-label="Mi cuenta">
          <p className="app-account__email">{session.email ?? '—'}</p>
          <p className="app-account__role">{ROLE_LABEL[session.role ?? ''] ?? ''}</p>
          <button
            type="button"
            className="nb-button nb-button-accent"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
