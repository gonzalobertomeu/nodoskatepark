import { useState } from 'react';
import {
  SkaterDirectoryApiError,
  skaterDirectoryClient,
} from '../services/skater-directory-client';

interface SkaterEditFormProps {
  accountId: string;
  currentApodo: string | null;
  currentAfeccionesDeSalud: string | null;
  onSaved: () => void;
}

/**
 * User Story 3 — apodo, foto, afecciones de salud only (FR-009). No field for anything else
 * (FR-010 is enforced by the write contract's shape, not by this form hiding fields).
 */
export function SkaterEditForm({
  accountId,
  currentApodo,
  currentAfeccionesDeSalud,
  onSaved,
}: SkaterEditFormProps) {
  const [apodo, setApodo] = useState(currentApodo ?? '');
  const [afeccionesDeSalud, setAfeccionesDeSalud] = useState(currentAfeccionesDeSalud ?? '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSavedMessage(false);
    setSubmitting(true);
    try {
      await skaterDirectoryClient.updateSkaterEditableFields(accountId, {
        apodo: apodo.trim() || null,
        afeccionesDeSalud: afeccionesDeSalud.trim() || null,
      });
      if (photoFile) {
        await skaterDirectoryClient.uploadSkaterPhoto(accountId, photoFile);
        setPhotoFile(null);
      }
      setSavedMessage(true);
      onSaved();
    } catch (err) {
      if (err instanceof SkaterDirectoryApiError) {
        setError(err.body.message);
      } else {
        setError('No pudimos conectar con el servidor. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="nb-title">Editar</h2>
      {error && <div className="nb-error">{error}</div>}
      {savedMessage && <div className="nb-success">Cambios guardados.</div>}

      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-apodo">
          Apodo
        </label>
        <input
          id="skater-apodo"
          className="nb-input"
          type="text"
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
        />
      </div>

      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-afecciones">
          Afecciones de salud
        </label>
        <textarea
          id="skater-afecciones"
          className="nb-input"
          value={afeccionesDeSalud}
          onChange={(e) => setAfeccionesDeSalud(e.target.value)}
        />
      </div>

      <div className="nb-field">
        <label className="nb-label" htmlFor="skater-foto">
          Foto (JPEG, PNG o WebP, hasta 5MB)
        </label>
        <input
          id="skater-foto"
          className="nb-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <button type="submit" className="nb-button nb-button-accent" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
