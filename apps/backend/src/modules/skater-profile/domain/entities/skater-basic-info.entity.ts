export interface SkaterBasicInfo {
  accountId: string;
  nombre: string | null;
  apellido: string | null;
  fechaDeNacimiento: Date | null;
}

/** Derived, never stored: true iff all three fields are set (data-model.md). */
export function isComplete(
  info: Pick<SkaterBasicInfo, 'nombre' | 'apellido' | 'fechaDeNacimiento'>,
): boolean {
  return info.nombre !== null && info.apellido !== null && info.fechaDeNacimiento !== null;
}
