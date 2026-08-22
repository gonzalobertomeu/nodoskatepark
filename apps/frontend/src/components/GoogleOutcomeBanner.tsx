import {
  GOOGLE_CALLBACK_OUTCOME_QUERY_PARAM,
  GoogleCallbackOutcome,
} from '@nodoskatepark/contracts';
import { useEffect, useState } from 'react';

const MESSAGES: Record<string, string> = {
  [GoogleCallbackOutcome.Cancelled]: 'El inicio de sesión con Google no se completó.',
  [GoogleCallbackOutcome.AccountUnavailable]: 'Esta cuenta no está disponible.',
};

/** Client-only: reads the callback outcome query flag set by GET /auth/google/callback. */
export function GoogleOutcomeBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const outcome = new URLSearchParams(window.location.search).get(
      GOOGLE_CALLBACK_OUTCOME_QUERY_PARAM,
    );
    if (outcome && MESSAGES[outcome]) {
      setMessage(MESSAGES[outcome]);
    }
  }, []);

  if (!message) {
    return null;
  }

  return <div className="nb-error">{message}</div>;
}
