import { AuthErrorCode } from '@nodoskatepark/contracts';
import { useState } from 'react';
import { AuthApiError, authClient } from '../services/auth-client';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authClient.register({ email, password });
      setRegistered(true);
    } catch (err) {
      if (err instanceof AuthApiError && err.body.error === AuthErrorCode.GoogleAccountExists) {
        setError('Ese email ya está vinculado a una cuenta de Google. Ingresá con Google.');
      } else if (err instanceof AuthApiError && err.status === 409) {
        setError('Ya existe una cuenta con ese email. Probá iniciar sesión.');
      } else if (err instanceof AuthApiError) {
        setError('Revisá los datos ingresados e intentá de nuevo.');
      } else {
        setError('No pudimos conectar con el servidor. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="nb-success">
        Cuenta creada. Te enviamos un email para verificar tu dirección — hacé clic en el enlace
        antes de intentar ingresar.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="nb-error">{error}</div>}

      <div className="nb-field">
        <label className="nb-label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          className="nb-input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="nb-field">
        <label className="nb-label" htmlFor="register-password">
          Contraseña
        </label>
        <input
          id="register-password"
          className="nb-input"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
        {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  );
}
