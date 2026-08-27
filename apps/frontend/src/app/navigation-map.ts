import type { AccountRole } from '@nodoskatepark/contracts';

/**
 * The information architecture of the authenticated application (006-role-based-bottom-nav).
 *
 * This module is deliberately free of React: the destination set is data, and keeping it that way
 * lets it be tested on its own. The id → component wiring lives in `destination-registry.tsx`.
 *
 * The set a person sees is derived here, from the role the session already exposes — the server is
 * never asked for it (FR-007a). Hiding a destination is presentation only; the server keeps
 * rejecting whatever the role may not use (FR-012).
 */

export type DestinationId = 'bookings' | 'profile' | 'settings' | 'skaters' | 'staff' | 'schedule';

export interface Destination {
  id: DestinationId;
  /** Visible label. Fixed by FR-002a and asserted literally by the tests — not configurable. */
  label: string;
  path: string;
  /** Placeholder glyph. The design phase replaces these with real icons and nothing else. */
  icon: string;
  status: 'built' | 'in-preparation';
}

export interface NestedSurface {
  path: string;
  parent: DestinationId;
  title: string;
}

const BOOKINGS: Destination = {
  id: 'bookings',
  label: 'Reservar clases',
  path: '/bookings',
  icon: '🛹',
  status: 'in-preparation',
};

const PROFILE: Destination = {
  id: 'profile',
  label: 'Mi perfil',
  path: '/profile',
  icon: '👤',
  status: 'built',
};

const SETTINGS: Destination = {
  id: 'settings',
  label: 'Configuración',
  path: '/settings',
  icon: '⚙️',
  status: 'built',
};

const SKATERS: Destination = {
  id: 'skaters',
  label: 'Skaters',
  path: '/skaters',
  icon: '🛹',
  status: 'built',
};

const STAFF: Destination = {
  id: 'staff',
  label: 'Staff',
  path: '/staff',
  icon: '🧑‍🏫',
  status: 'built',
};

const SCHEDULE: Destination = {
  id: 'schedule',
  label: 'Horarios de clases',
  path: '/schedule',
  icon: '🗓️',
  status: 'in-preparation',
};

/**
 * Ordered per role. Index 0 is both the post-login landing (FR-013) and the destination a person
 * is moved to when the section they were on stops being permitted (FR-014a).
 *
 * "Staff" appears only for administrador: 005-staff-directory made that listing exclusive to that
 * role and this feature does not reopen it (FR-010).
 */
export const ROLE_DESTINATIONS: Record<AccountRole, Destination[]> = {
  skater: [BOOKINGS, PROFILE, SETTINGS],
  instructor: [SKATERS, SCHEDULE],
  administrador: [SKATERS, STAFF, SCHEDULE],
};

/**
 * Surfaces that already existed and are not first-level destinations (FR-022). Each declares the
 * destination it lives under, which is what stays marked active while it is open and where "up one
 * level" returns to.
 */
export const NESTED_SURFACES: NestedSurface[] = [
  { path: '/skaters/profile', parent: 'skaters', title: 'Perfil del skater' },
  { path: '/staff/instructors', parent: 'staff', title: 'Asignar instructor' },
];

export function destinationsFor(role: AccountRole): Destination[] {
  return ROLE_DESTINATIONS[role];
}

export function landingPathFor(role: AccountRole): string {
  return ROLE_DESTINATIONS[role][0].path;
}

export function nestedSurfaceFor(pathname: string): NestedSurface | null {
  return NESTED_SURFACES.find((surface) => surface.path === pathname) ?? null;
}

/**
 * Which destination a pathname belongs to, for the role given — a destination root, or the parent
 * of a nested surface. `null` means this role may not be here, which is what makes the shell
 * replace the location with the role's first destination.
 */
export function resolveDestination(role: AccountRole, pathname: string): Destination | null {
  const available = destinationsFor(role);
  const direct = available.find((destination) => destination.path === pathname);
  if (direct) {
    return direct;
  }

  const nested = nestedSurfaceFor(pathname);
  if (!nested) {
    return null;
  }

  return available.find((destination) => destination.id === nested.parent) ?? null;
}

/** Every addressable path of the authenticated environment, for Astro's getStaticPaths. */
export const ADDRESSABLE_PATHS: string[] = [
  ...new Set([
    ...Object.values(ROLE_DESTINATIONS).flatMap((set) => set.map((d) => d.path)),
    ...NESTED_SURFACES.map((surface) => surface.path),
  ]),
];
