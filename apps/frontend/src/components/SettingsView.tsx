import { useState } from 'react';
import { leaveApp } from '../app/router';
import { useSession } from '../app/session-context';
import { authClient } from '../services/auth-client';

/**
 * The skater's "Configuración" destination (006-role-based-bottom-nav).
 *
 * This is the one place a skater signs out, so it ships with real content from the first release
 * and never as an "in preparation" section (FR-018). Its contents are the account's own data —
 * email and password — and sign-out; what identifies the skater inside the skatepark lives in "Mi
 * perfil" instead, and no field appears in both (FR-018a).
 *
 * "Password" is presented as something manageable, not something displayed: the action reuses the
 * existing password-recovery flow against the account's own email, so this feature adds no new
 * credential surface (research.md §5).
 */
export function SettingsView() {
  const session = useSession();
  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [signingOut, setSigningOut] = useState(false);

  async function changePassword(): Promise<void> {
    if (!session.email) {
      return;
    }
    setResetState('sending');
    try {
      await authClient.requestPasswordReset({ email: session.email });
      setResetState('sent');
    } catch {
      setResetState('failed');
    }
  }

  async function signOut(): Promise<void> {
    setSigningOut(true);
    try {
      await authClient.logout();
    } catch {
      // Even if the call fails, the local session is of no further use: leaving for the login
      // screen is the honest outcome, never staying on a section with no way out.
    }
    leaveApp('/login');
  }

  return (
    <div>
      <section>
        <p className="nb-label">Email de la cuenta</p>
        <p className="nb-field">{session.email ?? '—'}</p>
      </section>

      <section>
        <p className="nb-label">Contraseña</p>
        <p className="nb-field">
          Te enviamos un enlace a tu email para elegir una contraseña nueva.
        </p>
        {resetState === 'sent' ? (
          <p className="nb-success">
            Listo. Revisá tu correo: el enlace para cambiar la contraseña ya está en camino.
          </p>
        ) : null}
        {resetState === 'failed' ? (
          <p className="nb-error">No pudimos enviar el enlace. Intentá de nuevo.</p>
        ) : null}
        <button
          type="button"
          className="nb-button"
          onClick={changePassword}
          disabled={resetState === 'sending' || !session.email}
        >
          {resetState === 'sending' ? 'Enviando…' : 'Cambiar contraseña'}
        </button>
      </section>

      <div className="nb-divider">Sesión</div>

      <button
        type="button"
        className="nb-button nb-button-accent"
        onClick={signOut}
        disabled={signingOut}
      >
        {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
