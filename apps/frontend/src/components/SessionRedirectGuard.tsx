import { useEffect } from 'react';
import { authClient } from '../services/auth-client';

/**
 * Client-only: if the visitor already has a valid session, redirect away from /login to
 * MainApp instead of showing the login form (FR-018). Astro output is static — no SSR cookie
 * access — so this check has to run in the browser.
 */
export function SessionRedirectGuard() {
  useEffect(() => {
    authClient
      .session()
      .then((result) => {
        if (result.authenticated) {
          window.location.assign('/');
        }
      })
      .catch(() => {
        // No session / network error: stay on the login view.
      });
  }, []);

  return null;
}
