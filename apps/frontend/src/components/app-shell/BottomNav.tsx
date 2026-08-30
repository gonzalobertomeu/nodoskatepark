import type { MouseEvent } from 'react';
import type { Destination, DestinationId } from '../../app/navigation-map';

interface Props {
  destinations: Destination[];
  activeId: DestinationId | null;
  onNavigate: (path: string) => void;
}

/**
 * The primary navigation of the authenticated application (FR-001 to FR-004).
 *
 * Real <a href> elements, not buttons: that gives keyboard reachability and activation for free
 * (FR-027b), keeps every destination a shareable address (FR-020a), and leaves "open in a new tab"
 * working. The click handler only intercepts a plain primary click, so modified clicks still
 * behave the way the browser's own do.
 *
 * The same component renders the phone bar and the desktop rail — only the CSS layout differs, so
 * the destinations, their order and the depth of every path cannot diverge between breakpoints
 * (FR-030, FR-031).
 */
export function BottomNav({ destinations, activeId, onNavigate }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>, path: string): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    onNavigate(path);
  }

  return (
    <nav className="app-nav" aria-label="Navegación principal">
      <ul className="app-nav__list">
        {destinations.map((destination) => {
          const isActive = destination.id === activeId;
          return (
            <li className="app-nav__item" key={destination.id}>
              <a
                className="app-nav__link"
                href={destination.path}
                // FR-027a: the active destination is announceable, not signalled by colour alone.
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => handleClick(event, destination.path)}
              >
                <span className="app-nav__icon" aria-hidden="true">
                  {destination.icon}
                </span>
                <span className="app-nav__label">{destination.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
