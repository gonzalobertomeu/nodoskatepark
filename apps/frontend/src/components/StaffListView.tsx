import type { StaffListEntryResponse } from '@nodoskatepark/contracts';
import { useEffect, useState } from 'react';
import { staffDirectoryClient } from '../services/staff-directory-client';

function displayName(item: StaffListEntryResponse): string {
  if (!item.nombre && !item.apellido) {
    return 'Perfil incompleto';
  }
  return [item.nombre, item.apellido].filter(Boolean).join(' ');
}

function roleLabel(role: StaffListEntryResponse['role']): string {
  return role === 'administrador' ? 'Administrador' : 'Instructor';
}

/**
 * User Story 1: full staff listing (instructor + administrador), "perfil incompleto" placeholder
 * for missing nombre/apellido (FR-004), deactivated badge (FR-005) — never a blank cell.
 * User Story 2: search box narrows the listing by name or email (FR-006).
 */
export function StaffListView() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<StaffListEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    staffDirectoryClient
      .listStaff({ q: query || undefined })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar el listado. Intentá de nuevo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div>
      <div className="nb-field">
        <label className="nb-label" htmlFor="staff-search">
          Buscar
        </label>
        <input
          id="staff-search"
          className="nb-input"
          type="text"
          placeholder="Nombre, apellido o email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="nb-error">{error}</div>}
      {loading && <div className="nb-field">Cargando…</div>}

      {!loading && items.length === 0 && !error && (
        <div className="nb-field">
          {query ? 'No se encontraron resultados.' : 'No hay staff cargado todavía.'}
        </div>
      )}

      {!loading &&
        items.map((item) => (
          <div
            key={item.accountId}
            className="nb-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <div>
                <strong>{displayName(item)}</strong>
              </div>
              <div>{item.email}</div>
              {item.status === 'deactivated' && <div className="nb-error">Desactivado</div>}
            </div>
            <div>{roleLabel(item.role)}</div>
          </div>
        ))}
    </div>
  );
}
