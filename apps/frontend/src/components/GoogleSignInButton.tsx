import { authClient } from '../services/auth-client';

export function GoogleSignInButton() {
  return (
    <a href={authClient.googleLoginUrl()} className="nb-button" style={{ textDecoration: 'none' }}>
      Ingresar con Google
    </a>
  );
}
