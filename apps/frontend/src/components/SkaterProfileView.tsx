import type { SkaterFullProfileResponse } from '@nodoskatepark/contracts';
import { useCallback, useEffect, useState } from 'react';
import { skaterDirectoryClient } from '../services/skater-directory-client';
import { SkaterEditForm } from './SkaterEditForm';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function calculateAge(fechaDeNacimiento: string | null): string {
  if (!fechaDeNacimiento) {
    return 'Perfil incompleto';
  }
  const birth = new Date(fechaDeNacimiento);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return String(age);
}

/**
 * Full profile (User Story 2) — explicit placeholders for every field that can be missing
 * (FR-006, FR-007, FR-008, FR-015, SC-002), never a blank cell or a rendering error.
 *
 * Reads `accountId` from the URL query string (`?accountId=`), not an Astro path param: the
 * frontend build is `output: "static"` (no SSR), so a dynamic `[accountId].astro` route would
 * need every account id known at build time via `getStaticPaths()` — impossible for runtime
 * data. Mirrors the same query-param pattern already used by verify-email/reset-password.
 */
export function SkaterProfileView() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [profile, setProfile] = useState<SkaterFullProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

  const reload = useCallback((id: string) => {
    skaterDirectoryClient
      .getSkaterProfile(id)
      .then(setProfile)
      .catch(() => setError('No pudimos cargar este perfil.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('accountId');
    setAccountId(id);
    if (!id) {
      setError('Falta el identificador del skater.');
      setLoading(false);
      return;
    }
    reload(id);
  }, [reload]);

  if (loading) {
    return <div className="nb-field">Cargando…</div>;
  }
  if (error || !profile || !accountId) {
    return <div className="nb-error">{error ?? 'Skater no encontrado.'}</div>;
  }

  const nombreCompleto =
    profile.nombre || profile.apellido
      ? [profile.nombre, profile.apellido].filter(Boolean).join(' ')
      : 'Perfil incompleto';

  return (
    <div>
      {profile.fotoPath ? (
        <img
          key={photoVersion}
          src={`${API_BASE_URL}/skater-directory/${accountId}/photo?v=${photoVersion}`}
          crossOrigin="use-credentials"
          alt=""
          width={120}
          height={120}
          style={{ objectFit: 'cover', border: '2px solid #000', marginBottom: '1rem' }}
        />
      ) : (
        <div
          style={{
            width: 120,
            height: 120,
            border: '2px solid #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          Sin foto
        </div>
      )}

      <div className="nb-field">
        <strong>Nombre completo:</strong> {nombreCompleto}
      </div>
      <div className="nb-field">
        <strong>Apodo:</strong> {profile.apodo ?? 'Sin apodo'}
      </div>
      <div className="nb-field">
        <strong>Edad:</strong> {calculateAge(profile.fechaDeNacimiento)}
      </div>
      <div className="nb-field">
        <strong>Email:</strong> {profile.email}
      </div>
      <div className="nb-field">
        <strong>Último ingreso:</strong>{' '}
        {profile.ultimoIngreso
          ? new Date(profile.ultimoIngreso).toLocaleString()
          : 'Sin ingresos registrados'}
      </div>
      <div className="nb-field">
        <strong>Afecciones de salud:</strong>{' '}
        {profile.afeccionesDeSalud || 'Sin afecciones declaradas'}
      </div>
      {profile.status === 'deactivated' && (
        <div className="nb-error">Esta cuenta está desactivada.</div>
      )}

      <hr style={{ margin: '1.5rem 0' }} />

      <SkaterEditForm
        accountId={accountId}
        currentApodo={profile.apodo}
        currentAfeccionesDeSalud={profile.afeccionesDeSalud}
        onSaved={() => {
          reload(accountId);
          setPhotoVersion((v) => v + 1);
        }}
      />
    </div>
  );
}
