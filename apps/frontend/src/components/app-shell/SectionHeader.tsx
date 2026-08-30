import type { ReactNode } from 'react';
import { forwardRef } from 'react';

interface Props {
  title: string;
  /** Present only on nested surfaces (FR-022): the explicit way back to the destination root. */
  onBack?: () => void;
  /** The persistent account element, for staff sections (FR-016). */
  accountElement?: ReactNode;
}

/**
 * Heading of every section in the shell.
 *
 * The <h1> takes tabIndex={-1} so the shell can move focus to it after a reload-free transition —
 * focus must never be left on an element that is no longer on screen (FR-027c).
 */
export const SectionHeader = forwardRef<HTMLHeadingElement, Props>(function SectionHeader(
  { title, onBack, accountElement },
  ref,
) {
  return (
    <div className="app-section-header">
      {onBack ? (
        <button type="button" className="app-back" onClick={onBack} aria-label="Volver">
          ←
        </button>
      ) : null}
      <h1 className="app-section-header__title" tabIndex={-1} ref={ref}>
        {title}
      </h1>
      {accountElement}
    </div>
  );
});
