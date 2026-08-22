/**
 * No real implementation exists anywhere yet — no check-in/access-control feature has been
 * built. Bound, for this feature's scope, to a local stub that always resolves `null` — exactly
 * the "sin ingresos registrados" state FR-008 already requires. A future check-in feature can
 * rebind this port to a real implementation without skater-directory changing (research.md #2).
 */
export abstract class LastCheckInReader {
  abstract findLastCheckInAt(accountId: string): Promise<Date | null>;
}
