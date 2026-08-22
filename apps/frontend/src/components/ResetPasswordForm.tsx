import { useEffect, useState } from 'react';
import { AuthApiError, authClient } from '../services/auth-client';

export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError('El enlace no es válido o expiró.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authClient.confirmPasswordReset({ token, newPassword });
      setDone(true);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError('El enlace no es válido o expiró. Solicitá uno nuevo.');
      } else {
        setError('No pudimos conectar con el servidor. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="nb-success">
        Tu contraseña fue actualizada. Ya podés <a href="/login">iniciar sesión</a> con la nueva
        contraseña.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="nb-error">{error}</div>}

      <div className="nb-field">
        <label className="nb-label" htmlFor="reset-password">
          Nueva contraseña
        </label>
        <input
          id="reset-password"
          className="nb-input"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Restablecer contraseña'}
      </button>
    </form>
  );
}
