import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { renderDestination, renderNested } from '../../app/destination-registry';
import {
  type Destination,
  type DestinationId,
  type NestedSurface,
  nestedSurfaceFor,
} from '../../app/navigation-map';
import { openNested } from '../../app/router';
import { SectionError } from './SectionError';
import { SectionHeader } from './SectionHeader';

interface Props {
  destinations: Destination[];
  activeId: DestinationId | null;
  nested: NestedSurface | null;
  headingRef: RefObject<HTMLHeadingElement>;
  onBack: () => void;
  accountElement?: ReactNode;
  /** Explanation shown when the shell had to move the person elsewhere (FR-014a). */
  notice?: string | null;
}

/**
 * Holds one live panel per destination visited in this navigation session.
 *
 * A destination is mounted the first time it is opened and then never unmounted: the inactive ones
 * are hidden, not destroyed. That is what preserves each section's view state — the search text,
 * the page, the results — with no bookkeeping at all (FR-019), and what makes returning to a
 * destination a CSS change rather than a re-render plus a re-fetch, which is how the 100 ms
 * ceiling of FR-020c is met without pre-mounting anything at sign-in.
 *
 * Scroll position comes free from the same arrangement: each panel is its own scroll container
 * (see app-shell.css), so its scrollTop survives being hidden — nothing is saved or restored.
 *
 * A nested surface is layered on top of its destination rather than replacing it, so returning
 * from, say, a skater's profile finds the listing exactly as it was left. Nested surfaces are not
 * kept alive after leaving: they are transient and their address carries the record they show.
 */
export function DestinationHost({
  destinations,
  activeId,
  nested,
  headingRef,
  onBack,
  accountElement,
  notice,
}: Props) {
  const mounted = useRef<Set<DestinationId>>(new Set());
  if (activeId) {
    mounted.current.add(activeId);
  }

  /**
   * The adopted views link to their nested surfaces with plain <a href> — which is right: those
   * are real, shareable addresses (FR-020a). One native listener on the panel container turns
   * those clicks into in-app navigation with no document reload (FR-020), without editing a single
   * adopted view, and covers any view adopted later for free.
   *
   * A native listener rather than an onClick prop on a <div>: the links keep their own focus and
   * keyboard behaviour, and no non-interactive element gains a handler it shouldn't have.
   */
  const panels = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = panels.current;
    if (!container) {
      return;
    }
    function intercept(event: MouseEvent): void {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      if (event.altKey || event.button !== 0) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !nestedSurfaceFor(url.pathname)) {
        return;
      }
      event.preventDefault();
      openNested(`${url.pathname}${url.search}`);
    }
    container.addEventListener('click', intercept);
    return () => container.removeEventListener('click', intercept);
  }, []);

  const live = destinations.filter((destination) => mounted.current.has(destination.id));

  return (
    <div className="app-shell__panels" ref={panels}>
      {live.map((destination) => {
        const isActive = destination.id === activeId && nested === null;
        return (
          <section className="app-panel" key={destination.id} hidden={!isActive}>
            <div className="app-panel__inner">
              <SectionHeader
                title={destination.label}
                accountElement={isActive ? accountElement : undefined}
                ref={isActive ? headingRef : undefined}
              />
              {isActive && notice ? (
                <p className="app-notice" role="status">
                  {notice}
                </p>
              ) : null}
              <SectionError resetKey={destination.id}>
                {renderDestination(destination)}
              </SectionError>
            </div>
          </section>
        );
      })}

      {nested ? (
        <section className="app-panel" key={nested.path}>
          <div className="app-panel__inner">
            <SectionHeader
              title={nested.title}
              onBack={onBack}
              accountElement={accountElement}
              ref={headingRef}
            />
            <SectionError resetKey={nested.path}>{renderNested(nested)}</SectionError>
          </div>
        </section>
      ) : null}
    </div>
  );
}
