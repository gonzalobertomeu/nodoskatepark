import { openNested } from '../../app/router';
import { StaffListView } from '../StaffListView';

/**
 * The "Staff" destination: 005-staff-directory's listing, adopted unmodified, plus the entry point
 * to the nested instructor-assignment surface.
 *
 * 003-instructor-role-assignment used to live at its own `/instructors` page reachable only by
 * typing the address. It nests under this destination instead of taking a first-level one, which
 * keeps the administrador's bar at three destinations and the path within the three-tap ceiling:
 * /staff (root) → "Asignar instructor" (1) → "Promover" on a row (2) — FR-021, FR-022.
 */
export function StaffDestinationPanel() {
  return (
    <div>
      <button
        type="button"
        className="nb-button"
        onClick={() => openNested('/staff/instructors')}
        style={{ marginBottom: '1.25rem' }}
      >
        Asignar instructor
      </button>
      <StaffListView />
    </div>
  );
}
