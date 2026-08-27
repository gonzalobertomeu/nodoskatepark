import type { AccountRole } from '@nodoskatepark/contracts';
import { useEffect, useRef, useState } from 'react';
import {
  type Destination,
  destinationsFor,
  landingPathFor,
  type NestedSurface,
  nestedSurfaceFor,
  resolveDestination,
} from '../../app/navigation-map';
import { currentPath, goToDestination, goUp, leaveApp, subscribe } from '../../app/router';
import { SessionProvider, useSession } from '../../app/session-context';
import { AccountMenu } from './AccountMenu';
import { BottomNav } from './BottomNav';
import { DestinationHost } from './DestinationHost';

/**
 * The authenticated application shell (006-role-based-bottom-nav).
 *
 * Owns four things: which destinations exist for this role, which surface the current address
 * points at, whether this role may be there at all, and where the keyboard focus goes after a
 * reload-free transition.
 *
 * What it deliberately does NOT own is access control. Hiding a destination is presentation; the
 * server keeps rejecting whatever the role may not use, however it is reached (FR-012).
 */

export function AppShell({ initialPath }: { initialPath: string }) {
  return (
    <SessionProvider>
      <AppShellInner initialPath={initialPath} />
    </SessionProvider>
  );
}

/**
 * The shell itself, without the session provider around it. Exported so tests can drive it with a
 * fixed session instead of the network.
 */
export function AppShellInner({ initialPath }: { initialPath: string }) {
  const session = useSession();
  const [path, setPath] = useState(initialPath);
  /**
   * The explanation shown after the shell had to move someone (FR-014a). It carries the address it
   * belongs to: the forced move changes `path` right away, and without that pairing the very
   * redirection would clear the message before it was ever read.
   */
  const [notice, setNotice] = useState<{ path: string; text: string } | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousRole = useRef<AccountRole | null>(null);
  const previousSurface = useRef<string | null>(null);

  useEffect(() => {
    setPath(currentPath());
    return subscribe(setPath);
  }, []);

  const role = session.status === 'authenticated' ? session.role : null;
  const destinations: Destination[] = role ? destinationsFor(role) : [];
  const nested: NestedSurface | null = role ? nestedSurfaceFor(path) : null;
  const active: Destination | null = role ? resolveDestination(role, path) : null;

  // Guards and redirections. One effect so the order is explicit: session first, then onboarding,
  // then whether this role may be at this address.
  useEffect(() => {
    if (session.status === 'unauthenticated') {
      // FR-024: an expired or revoked session leaves the navigable environment; it never leaves a
      // section on screen with the bar up and no data.
      leaveApp('/login');
      return;
    }

    if (session.status !== 'authenticated' || !role) {
      return;
    }

    // FR-005: the mandatory onboarding step keeps its precedence; the bar is not shown until it is
    // complete.
    if (role === 'skater' && session.onboardingComplete === false) {
      leaveApp('/onboarding');
      return;
    }

    const roleChanged = previousRole.current !== null && previousRole.current !== role;
    previousRole.current = role;

    // FR-013: land on the first destination of the role, with no extra tap and no intermediate
    // screen — even when that destination is still in preparation.
    if (path === '/') {
      goToDestination(landingPathFor(role));
      return;
    }

    if (resolveDestination(role, path) === null) {
      // FR-014a: the section stopped being permitted. Replace it with the first destination of the
      // new role and say why, rather than leaving it on screen, showing a raw error, or signing
      // the person out.
      const landing = landingPathFor(role);
      setNotice({
        path: landing,
        text: roleChanged
          ? 'Tu rol cambió, así que esa sección dejó de estar disponible para tu cuenta. Te llevamos al inicio de tu nueva navegación.'
          : 'Esa sección no está disponible para tu cuenta.',
      });
      goToDestination(landing);
      return;
    }

    // Keep the explanation while the person is still on the address we sent them to; drop it as
    // soon as they navigate somewhere themselves.
    setNotice((current) => (current && current.path === path ? current : null));
  }, [session.status, session.onboardingComplete, role, path]);

  // FR-014: the role is re-checked on the next server interaction — a destination change — and
  // never on a timer or a pushed channel.
  const lastRevalidatedPath = useRef(initialPath);
  useEffect(() => {
    if (lastRevalidatedPath.current === path) {
      return;
    }
    lastRevalidatedPath.current = path;
    void session.revalidate();
  }, [path, session.revalidate]);

  // FR-027c: after a destination change or a move up one level, focus goes to the heading of the
  // section now on screen — never left on an element that is gone.
  const surfaceKey = `${active?.id ?? ''}|${nested?.path ?? ''}`;
  useEffect(() => {
    if (previousSurface.current !== null && previousSurface.current !== surfaceKey) {
      headingRef.current?.focus();
    }
    previousSurface.current = surfaceKey;
  }, [surfaceKey]);

  // FR-005: the mandatory onboarding keeps its precedence as a blocking step — the bar is not
  // drawn at all while a skater's profile is still incomplete, not even for the instant the
  // redirection takes.
  const blockedByOnboarding = role === 'skater' && session.onboardingComplete === false;

  if (session.status !== 'authenticated' || !role || !active || blockedByOnboarding) {
    return (
      <div className="app-shell">
        <div className="app-shell__panels">
          <section className="app-panel">
            <div className="app-panel__inner">
              <div className="app-skeleton" aria-hidden="true">
                <span className="app-skeleton__line" />
                <span className="app-skeleton__line" />
                <span className="app-skeleton__line" />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <DestinationHost
        destinations={destinations}
        activeId={active.id}
        nested={nested}
        headingRef={headingRef}
        onBack={() => goUp(active.path)}
        notice={notice && notice.path === path ? notice.text : null}
        /* FR-016: staff accounts reach their own account and sign-out from a persistent element in
           every section's header, so the staff bar stays dedicated to management destinations. A
           skater signs out from the "Configuración" destination instead (FR-018). */
        accountElement={role === 'skater' ? undefined : <AccountMenu />}
      />
      <BottomNav destinations={destinations} activeId={active.id} onNavigate={goToDestination} />
    </div>
  );
}
