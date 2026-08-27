import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { SettingsView } from '../src/components/SettingsView';
import { sessionFor, stubFetch, withSession } from './helpers';

afterEach(cleanup);

describe('el destino Configuración del skater (US1, FR-018, FR-018a)', () => {
  test('presenta los datos de la cuenta y el cierre de sesión, con contenido real', () => {
    const restore = stubFetch();
    render(withSession(sessionFor('skater'), <SettingsView />));

    expect(screen.getByText('persona@nodoskatepark.test')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeDefined();
    restore();
  });

  test('no queda como sección en preparación (FR-018)', () => {
    const restore = stubFetch();
    render(withSession(sessionFor('skater'), <SettingsView />));

    expect(screen.queryByText('Sección en preparación')).toBeNull();
    restore();
  });

  test('no repite los datos que identifican al skater dentro del skatepark (SC-009)', () => {
    const restore = stubFetch();
    const { container } = render(withSession(sessionFor('skater'), <SettingsView />));

    // Nombre, apellido y fecha de nacimiento son de "Mi perfil"; ningún dato aparece en ambos.
    expect(container.textContent).not.toContain('Nombre');
    expect(container.textContent).not.toContain('Apellido');
    expect(container.textContent).not.toContain('Fecha de nacimiento');
    restore();
  });
});
