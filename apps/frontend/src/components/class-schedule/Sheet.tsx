import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useSheetHistory } from './useSheetHistory';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal sheet: the native-feeling presentation Principle IX endorses for a secondary flow, and the
 * reason this feature adds no routes to 006's destination map (research.md §8).
 */
export function Sheet({ title, onClose, children }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useSheetHistory(true, onClose);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="cs-sheet-backdrop">
      <div className="cs-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="cs-sheet__title" tabIndex={-1} ref={heading}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
