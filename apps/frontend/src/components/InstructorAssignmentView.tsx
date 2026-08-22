import type { PendingInvitation, SkaterListEntryResponse } from '@nodoskatepark/contracts';
import { useCallback, useEffect, useState } from 'react';
import { instructorAssignmentClient } from '../services/instructor-assignment-client';
import { skaterDirectoryClient } from '../services/skater-directory-client';

function displayName(item: SkaterListEntryResponse): string {
  if (!item.nombre && !item.apellido) {
    return 'Perfil incompleto';
  }
  return [item.nombre, item.apellido].filter(Boolean).join(' ');
}

/**
 * User Story 1: promotion picker reusing 002's unmodified `GET /skater-directory` listing for
 * search (Clarifications) — no new listing endpoint. Each row promotes its own account and shows
 * the resulting outcome (`ok` or a `no_op` reason, research.md #3 — never treated as an error).
 */
function inviteOutcomeMessage(
  result: Awaited<ReturnType<typeof instructorAssignmentClient.inviteInstructor>>,
): string {
  if (result.status === 'ok') {
    return result.outcome === 'invited'
      ? 'Invitación creada. Se aplicará automáticamente cuando esa persona se registre.'
      : 'Esa persona ya tenía una cuenta — ahora es instructor.';
  }
  if (result.reason === 'already_instructor') return 'Ya es instructor.';
  if (result.reason === 'already_administrador') return 'Ya es administrador.';
  return 'Ya hay una invitación pendiente para ese email.';
}

export function InstructorAssignmentView() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SkaterListEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowState, setRowState] = useState<Record<string, string>>({});

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadPendingInvitations = useCallback(() => {
    setPendingLoading(true);
    instructorAssignmentClient
      .listPendingInvitations()
      .then((result) => setPendingInvitations(result.items))
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    skaterDirectoryClient
      .listSkaters({ q: query || undefined })
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

  async function promote(accountId: string) {
    setRowState((prev) => ({ ...prev, [accountId]: 'Procesando…' }));
    try {
      const result = await instructorAssignmentClient.promoteExistingUser(accountId);
      if (result.status === 'ok') {
        setRowState((prev) => ({ ...prev, [accountId]: 'Ahora es instructor.' }));
      } else if (result.reason === 'already_instructor') {
        setRowState((prev) => ({ ...prev, [accountId]: 'Ya es instructor.' }));
      } else {
        setRowState((prev) => ({ ...prev, [accountId]: 'Ya es administrador.' }));
      }
    } catch {
      setRowState((prev) => ({
        ...prev,
        [accountId]: 'No se pudo completar la promoción. Intentá de nuevo.',
      }));
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteStatus(null);
    try {
      const result = await instructorAssignmentClient.inviteInstructor({ email: inviteEmail });
      setInviteStatus(inviteOutcomeMessage(result));
      if (result.status === 'ok') {
        setInviteEmail('');
        if (result.outcome === 'invited') {
          loadPendingInvitations();
        }
      }
    } catch {
      setInviteStatus('No se pudo completar la invitación. Intentá de nuevo.');
    } finally {
      setInviting(false);
    }
  }

  async function cancelInvitation(invitationId: string) {
    setCancellingId(invitationId);
    try {
      await instructorAssignmentClient.cancelInvitation(invitationId);
      setPendingInvitations((prev) => prev.filter((item) => item.id !== invitationId));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div>
      <div className="nb-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="nb-title">Invitaciones pendientes</h2>
        {pendingLoading && <div className="nb-field">Cargando…</div>}
        {!pendingLoading && pendingInvitations.length === 0 && (
          <div className="nb-field">No hay invitaciones pendientes.</div>
        )}
        {!pendingLoading &&
          pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              <span>{invitation.email}</span>
              <button
                type="button"
                className="nb-button"
                onClick={() => cancelInvitation(invitation.id)}
                disabled={cancellingId === invitation.id}
              >
                Cancelar
              </button>
            </div>
          ))}
      </div>

      <form onSubmit={invite} className="nb-card" style={{ marginBottom: '1.5rem' }}>
        <div className="nb-field">
          <label className="nb-label" htmlFor="instructor-invite-email">
            Invitar por email
          </label>
          <input
            id="instructor-invite-email"
            className="nb-input"
            type="email"
            placeholder="persona@ejemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
        </div>
        {inviteStatus && <div className="nb-field">{inviteStatus}</div>}
        <button type="submit" className="nb-button" disabled={inviting}>
          Invitar
        </button>
      </form>

      <div className="nb-field">
        <label className="nb-label" htmlFor="instructor-picker-search">
          Buscar skater
        </label>
        <input
          id="instructor-picker-search"
          className="nb-input"
          type="text"
          placeholder="Nombre, apellido o apodo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="nb-error">{error}</div>}
      {loading && <div className="nb-field">Cargando…</div>}

      {!loading && items.length === 0 && !error && (
        <div className="nb-field">No se encontraron skaters.</div>
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
              <strong>{displayName(item)}</strong>
              {item.apodo && <span> "{item.apodo}"</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {rowState[item.accountId] && <span>{rowState[item.accountId]}</span>}
              <button
                type="button"
                className="nb-button"
                onClick={() => promote(item.accountId)}
                disabled={rowState[item.accountId] === 'Procesando…'}
              >
                Promover a instructor
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
