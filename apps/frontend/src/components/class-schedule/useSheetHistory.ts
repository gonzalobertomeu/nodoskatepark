import { useEffect } from 'react';

/**
 * Makes the device's back gesture close a modal sheet instead of leaving the application.
 *
 * The sheet has no address of its own — it is an in-place presentation, not a nested surface, so
 * FR-020a of 006 does not ask for one. But it MUST push a history entry all the same: without it,
 * "back" has nothing of the sheet to pop and jumps to the previous entry, which from a destination
 * root means leaving the authenticated environment (006, FR-022a) — losing a half-filled form.
 *
 * Same address, one extra entry: the standard modal-history pattern.
 */
export function useSheetHistory(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return;
    }

    window.history.pushState({ kind: 'sheet' }, '', window.location.href);
    let closedByBack = false;

    function handlePopState(): void {
      closedByBack = true;
      onClose();
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Closed from the screen rather than by "back": drop the entry we pushed so it does not
      // linger and swallow the next back gesture.
      if (!closedByBack && window.history.state?.kind === 'sheet') {
        window.history.back();
      }
    };
  }, [open, onClose]);
}
