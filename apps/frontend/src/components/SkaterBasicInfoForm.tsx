import { useEffect, useState } from 'react';
import { SkaterProfileApiError, skaterProfileClient } from '../services/skater-profile-client';

interface SkaterBasicInfoFormProps {
  /**
   * "create" = onboarding (User Story 1): redirects to "/" on success.
   * "edit" = self-service update (User Story 2): stays on the page and shows a saved message.
   */
  mode: 'create' | 'edit';
}

/**
 * Shared by /onboarding (mode="create") and /profile (mode="edit") — both call the same
 * PUT /skater-profile/me operation with all three fields required together (FR-009).
 */
export function SkaterBasicInfoForm({ mode }: SkaterBasicInfoFormProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaDeNacimiento, setFechaDeNacimiento] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    skaterProfileClient
      .getMyBasicInfo()
      .then((info) => {
        // create mode = /onboarding: redirect away if there is nothing left to complete, so a
        // skater who already finished onboarding (or bookmarked the page) lands on the MainApp
        // instead of re-seeing this form (Polish — mirrors FR-008's staff exclusion below).
        if (mode === 'create' && info.complete) {
          window.location.assign('/');
          return;
        }
        setNombre(info.nombre ?? '');
        setApellido(info.apellido ?? '');
        setFechaDeNacimiento(info.fechaDeNacimiento ? info.fechaDeNacimiento.slice(0, 10) : '');
      })
      .catch((err) => {
        if (mode === 'create' && err instanceof SkaterProfileApiError) {
          if (err.body.error === 'unauthenticated') {
            window.location.assign('/login');
          } else if (err.body.error === 'forbidden') {
            // Staff account landed on /onboarding directly — this feature is skater-only.
            window.location.assign('/');
          }
          return;
        }
        // No prior data (or a transient error) — the form simply starts blank/editable.
      })
      .finally(() => setLoading(false));
  }, [mode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSavedMessage(false);

    if (!nombre.trim() || !apellido.trim() || !fechaDeNacimiento) {
      setError('Completá nombre, apellido y fecha de nacimiento para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      await skaterProfileClient.saveMyBasicInfo({ nombre, apellido, fechaDeNacimiento });
      if (mode === 'create') {
        window.location.assign('/');
      } else {
        setSavedMessage(true);
      }
    } catch (err) {
      if (err instanceof SkaterProfileApiError) {
        setError(err.body.message);
      } else {
        setError('No pudimos conectar con el servidor. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="nb-field">Cargando…</div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="nb-error">{error}</div>}
      {savedMessage && <div className="nb-success">Cambios guardados.</div>}

      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-nombre">
          Nombre
        </label>
        <input
          id="skater-nombre"
          className="nb-input"
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-apellido">
          Apellido
        </label>
        <input
          id="skater-apellido"
          className="nb-input"
          type="text"
          required
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
        />
      </div>

      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-fecha-nacimiento">
          Fecha de nacimiento
        </label>
        <input
          id="skater-fecha-nacimiento"
          className="nb-input"
          type="date"
          required
          value={fechaDeNacimiento}
          onChange={(e) => setFechaDeNacimiento(e.target.value)}
        />
      </div>

      <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
        {submitting ? 'Guardando…' : mode === 'create' ? 'Continuar' : 'Guardar cambios'}
      </button>
    </form>
  );
}
