/**
 * Minimal History API router for the authenticated shell (006-role-based-bottom-nav).
 *
 * Hand-rolled rather than pulled from a library because the two hard parts of this feature are
 * exactly the two things a conventional router does differently:
 *
 *  - A router unmounts the previous route's component. FR-019 needs the opposite — visited
 *    destinations stay mounted — so the keep-alive container has to exist either way.
 *  - FR-022b needs a destination switch to REPLACE the history entry while opening a nested
 *    surface PUSHES one, so "back" means "up one level" and never ping-pongs between
 *    destinations. That is one explicit call per navigation kind, not a default.
 *
 * pushState/replaceState do not fire popstate, so this module notifies its own subscribers.
 */

type Listener = (path: string) => void;

const listeners = new Set<Listener>();

export function currentPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return window.location.pathname;
}

export function currentSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.search;
}

function notify(): void {
  const path = currentPath();
  for (const listener of listeners) {
    listener(path);
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('popstate', notify);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('popstate', notify);
    }
  };
}

/**
 * Switch to another destination. Replaces the current history entry (FR-022b): "back" from a
 * destination root leaves the authenticated environment rather than returning to the destination
 * visited before it.
 *
 * Navigating to the destination already active is a no-op — it must not discard that section's
 * state (FR-006).
 */
export function goToDestination(path: string): void {
  if (typeof window === 'undefined' || currentPath() === path) {
    return;
  }
  window.history.replaceState({ kind: 'destination' }, '', path);
  notify();
}

/**
 * Open a surface nested under a destination. Pushes a history entry (FR-022a) so the device's
 * back gesture returns to that destination's root, exactly like the on-screen back affordance.
 */
export function openNested(path: string): void {
  if (typeof window === 'undefined' || currentPath() + currentSearch() === path) {
    return;
  }
  window.history.pushState({ kind: 'nested' }, '', path);
  notify();
}

/**
 * Up one level: back to the root of the destination the current surface belongs to. Uses the
 * browser's own back when the nested surface was pushed by us, so the forward history stays sane;
 * falls back to a replace when this was the entry point (direct link, fresh reload).
 */
export function goUp(destinationPath: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (window.history.state?.kind === 'nested') {
    window.history.back();
    return;
  }
  window.history.replaceState({ kind: 'destination' }, '', destinationPath);
  notify();
}

/** Leaves the authenticated environment entirely — session lost, or onboarding still pending. */
export function leaveApp(path: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.location.assign(path);
}
