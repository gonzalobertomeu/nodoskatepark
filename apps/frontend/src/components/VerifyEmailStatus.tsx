import { useEffect, useState } from 'react';
import { authClient } from '../services/auth-client';

type Status = 'pending' | 'success' | 'error';

export function VerifyEmailStatus() {
  const [status, setStatus] = useState<Status>('pending');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    authClient
      .confirmEmailVerification(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'pending') {
    return <div className="nb-field">Verificando tu email…</div>;
  }

  if (status === 'success') {
    return (
      <div className="nb-success">
        Tu email fue verificado. Ya podés <a href="/login">iniciar sesión</a>.
      </div>
    );
  }

  return <div className="nb-error">El enlace no es válido o expiró.</div>;
}
