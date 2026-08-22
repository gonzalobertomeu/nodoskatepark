import { useState } from 'react';
import { authClient } from '../services/auth-client';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      // FR-007: always 200, regardless of whether the email exists — no branching on the result.
      await authClient.requestPasswordReset({ email });
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="nb-success">
        Si el email está registrado, vas a recibir instrucciones para restablecer tu contraseña.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="nb-field">
        <label className="nb-label" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          className="nb-input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
        {submitting ? 'Enviando…' : 'Enviar instrucciones'}
      </button>
    </form>
  );
}
