export const ACCOUNT_CREATED_EVENT = 'account.created';

/**
 * Cross-cutting, no-single-owner event contract (Constitution II's `src/shared/` carve-out) —
 * neither `auth` (the emitter) nor `instructor-assignment` (the listener) owns this shape
 * exclusively, so it lives outside both modules' own `domain/`. `auth`'s RegisterAccountUseCase
 * and LoginWithGoogleUseCase's new-account branch emit this (awaited, via emitAsync) after a
 * brand-new account is created — research.md #1 of 003-instructor-role-assignment. Importing
 * this shared shape is not the same as either module importing the other's domain/application/
 * infrastructure files — it's exactly the kind of shared vocabulary `src/shared/` exists for.
 */
export interface AccountCreatedEvent {
  accountId: string;
  email: string;
}
