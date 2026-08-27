import { describe, expect, test } from 'bun:test';
import {
  ADDRESSABLE_PATHS,
  destinationsFor,
  landingPathFor,
  nestedSurfaceFor,
  ROLE_DESTINATIONS,
  resolveDestination,
} from '../src/app/navigation-map';

describe('conjunto de destinos por rol', () => {
  test('el skater ve exactamente sus tres destinos, en orden (FR-008, FR-002a)', () => {
    expect(destinationsFor('skater').map((d) => d.label)).toEqual([
      'Reservar clases',
      'Mi perfil',
      'Configuración',
    ]);
  });

  test('el administrador ve exactamente sus tres destinos, en orden (FR-009, FR-002a)', () => {
    expect(destinationsFor('administrador').map((d) => d.label)).toEqual([
      'Skaters',
      'Staff',
      'Horarios de clases',
    ]);
  });

  test('el instructor ve dos destinos y ninguno es Staff (FR-010)', () => {
    expect(destinationsFor('instructor').map((d) => d.label)).toEqual([
      'Skaters',
      'Horarios de clases',
    ]);
    expect(destinationsFor('instructor').some((d) => d.id === 'staff')).toBe(false);
  });

  test('el listado de staff aparece solo para administrador (FR-010)', () => {
    const rolesWithStaff = Object.entries(ROLE_DESTINATIONS)
      .filter(([, set]) => set.some((d) => d.id === 'staff'))
      .map(([role]) => role);
    expect(rolesWithStaff).toEqual(['administrador']);
  });

  test('ningún rol de staff ve destinos de skater, ni al revés (FR-011)', () => {
    const skaterIds = new Set(destinationsFor('skater').map((d) => d.id));
    for (const role of ['instructor', 'administrador'] as const) {
      for (const destination of destinationsFor(role)) {
        expect(skaterIds.has(destination.id)).toBe(false);
      }
    }
    const staffIds = new Set(
      [...destinationsFor('instructor'), ...destinationsFor('administrador')].map((d) => d.id),
    );
    for (const destination of destinationsFor('skater')) {
      expect(staffIds.has(destination.id)).toBe(false);
    }
  });

  test('todo rol se mantiene entre dos y cinco destinos (Principio IX)', () => {
    for (const set of Object.values(ROLE_DESTINATIONS)) {
      expect(set.length).toBeGreaterThanOrEqual(2);
      expect(set.length).toBeLessThanOrEqual(5);
    }
  });

  test('cada destino tiene etiqueta e icono, y rutas únicas dentro del rol (FR-002)', () => {
    for (const set of Object.values(ROLE_DESTINATIONS)) {
      for (const destination of set) {
        expect(destination.label.length).toBeGreaterThan(0);
        expect(destination.icon.length).toBeGreaterThan(0);
      }
      expect(new Set(set.map((d) => d.path)).size).toBe(set.length);
      expect(new Set(set.map((d) => d.label)).size).toBe(set.length);
    }
  });

  test('el aterrizaje es el primer destino del rol (FR-013)', () => {
    expect(landingPathFor('skater')).toBe('/bookings');
    expect(landingPathFor('instructor')).toBe('/skaters');
    expect(landingPathFor('administrador')).toBe('/skaters');
  });
});

describe('resolución de direcciones', () => {
  test('una superficie anidada marca activo su destino padre (FR-020a, FR-022)', () => {
    expect(resolveDestination('administrador', '/staff/instructors')?.id).toBe('staff');
    expect(resolveDestination('instructor', '/skaters/profile')?.id).toBe('skaters');
    expect(nestedSurfaceFor('/staff/instructors')?.parent).toBe('staff');
  });

  test('una dirección que el rol no puede usar no resuelve a ningún destino (FR-011)', () => {
    expect(resolveDestination('instructor', '/staff')).toBeNull();
    expect(resolveDestination('instructor', '/staff/instructors')).toBeNull();
    expect(resolveDestination('skater', '/skaters')).toBeNull();
    expect(resolveDestination('administrador', '/settings')).toBeNull();
  });

  test('las ocho direcciones del entorno autenticado están enumeradas (FR-020a)', () => {
    expect([...ADDRESSABLE_PATHS].sort()).toEqual([
      '/bookings',
      '/profile',
      '/schedule',
      '/settings',
      '/skaters',
      '/skaters/profile',
      '/staff',
      '/staff/instructors',
    ]);
  });
});
