import { useState } from 'react';
import { AuthApiError, authClient } from '../services/auth-client';

const GENERIC_ERROR = 'Email o contraseña incorrectos, o esta cuenta no está disponible.';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authClient.login({ email, password });
      window.location.assign('/');
    } catch (err) {
      // FR-003/FR-016: invalid_credentials and account_unavailable both render the same
      // generic message — never reveal which case occurred.
      if (err instanceof AuthApiError) {
        setError(GENERIC_ERROR);
      } else {
        setError('No pudimos conectar con el servidor. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="nb-error">{error}</div>}

      <div className="nb-field">
        <label className="nb-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="nb-input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="nb-field">
        <label className="nb-label" htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          className="nb-input"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
        {submitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
