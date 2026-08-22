import type { SkaterListEntryResponse } from '@nodoskatepark/contracts';
import { useEffect, useState } from 'react';
import { skaterDirectoryClient } from '../services/skater-directory-client';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function displayName(item: SkaterListEntryResponse): string {
  if (!item.nombre && !item.apellido) {
    return 'Perfil incompleto';
  }
  return [item.nombre, item.apellido].filter(Boolean).join(' ');
}

/**
 * Search box + paginated listing (User Story 1). Placeholders for missing photo (FR-006) and
 * incomplete profile (FR-015) — never a blank cell or a broken image.
 */
export function SkaterListView() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<SkaterListEntryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    skaterDirectoryClient
      .listSkaters({ q: query || undefined, page })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
        setPageSize(result.pageSize);
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
  }, [query, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-search">
          Buscar
        </label>
        <input
          id="skater-search"
          className="nb-input"
          type="text"
          placeholder="Nombre, apellido o apodo"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && <div className="nb-error">{error}</div>}
      {loading && <div className="nb-field">Cargando…</div>}

      {!loading && items.length === 0 && !error && (
        <div className="nb-field">No se encontraron skaters.</div>
      )}

      {!loading &&
        items.map((item) => (
          <a
            key={item.accountId}
            href={`/skaters/profile?accountId=${item.accountId}`}
            className="nb-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.75rem',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {item.fotoPath ? (
              <img
                src={`${API_BASE_URL}/skater-directory/${item.accountId}/photo`}
                crossOrigin="use-credentials"
                alt=""
                width={48}
                height={48}
                style={{ objectFit: 'cover', border: '2px solid #000' }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: '2px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}
              >
                Sin foto
              </div>
            )}
            <div>
              <div>
                <strong>{displayName(item)}</strong>
              </div>
              {item.apodo && <div>"{item.apodo}"</div>}
              {item.status === 'deactivated' && <div className="nb-error">Desactivado</div>}
            </div>
          </a>
        ))}

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="nb-button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span className="nb-field">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="nb-button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
