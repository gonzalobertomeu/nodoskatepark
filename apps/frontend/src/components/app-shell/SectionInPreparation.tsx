interface Props {
  label: string;
}

/**
 * Explicit state for a destination whose feature has not been built yet (FR-025).
 *
 * Deliberately not an error and not an empty screen: the bar stays alive above it, so leaving for
 * another destination is a single tap (FR-026). Its dashed, calm styling is what keeps it
 * distinguishable from the accent-filled error block (FR-024b).
 */
export function SectionInPreparation({ label }: Props) {
  return (
    <div className="app-state app-state--preparing">
      <p className="app-state__title">Sección en preparación</p>
      <p className="app-state__body">
        «{label}» todavía no está disponible. Su lugar en la aplicación ya existe y aquí aparecerá
        cuando esté construida.
      </p>
      <p className="app-state__body">
        Mientras tanto, podés seguir usando el resto de la aplicación desde la barra.
      </p>
    </div>
  );
}
