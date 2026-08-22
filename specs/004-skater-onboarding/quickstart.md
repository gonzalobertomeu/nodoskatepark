# Quickstart: Validating Skater Onboarding & Self-Edit

Manual/scripted validation scenarios proving the feature works end-to-end. Assumes
001-user-login-sso is already implemented and running (login, registration, sessions) — this
feature only adds a gate + a new module on top of it.

## Prerequisites

- Bun installed; the same running PostgreSQL instance used by 001.
- `bun install` run at the repo root.
- At least one skater account already created via 001's registration/Google-SSO flow (guaranteed
  to have `nombre`/`apellido`/`fechaDeNacimiento` all `null`, since 001 never collected them).

## Setup

```bash
bun run --cwd apps/backend --bun prisma migrate deploy --schema prisma/schema.prisma
bun nx serve backend   # http://localhost:3000
bun nx serve frontend  # http://localhost:4321
```

## Scenario 1 — New account gated on first login (User Story 1, SC-001, SC-002)

1. Register a new skater account (via 001's `/register` + email verification), or log in with an
   existing skater account that has no `nombre`/`apellido`/`fechaDeNacimiento` set.
2. **Expect**: instead of landing on `/`, the browser is redirected to `/onboarding`.
3. Try to navigate directly to `/` while the profile is still incomplete.
4. **Expect**: redirected back to `/onboarding` (the gate lives at the MainApp entry point, not
   just at login — Edge Cases).
5. Fill in nombre, apellido, and a valid past birth date, and submit.
6. **Expect**: `PUT /skater-profile/me` returns `200`, the browser lands on `/`, and total time
   from login to reaching the MainApp is under 2 minutes (SC-001).

## Scenario 2 — Pre-existing account (created before this feature) is gated the same way (FR-002, User Story 1 AC4)

1. Using an account seeded directly in the DB with `nombre`/`apellido`/`fechaDeNacimiento` all
   `NULL` (simulating an account from before this feature existed), log in.
2. **Expect**: gated to `/onboarding`, identically to Scenario 1 — no special-casing by account
   age.

## Scenario 3 — Partial submission is rejected (FR-003, Edge Cases)

1. On `/onboarding`, fill in only nombre and apellido, leave fecha de nacimiento empty, and try
   to submit/continue.
2. **Expect**: the system blocks continuing and indicates the missing field; no `PUT` request
   succeeds with fewer than all three fields.

## Scenario 4 — Abandoning onboarding persists nothing (FR-009, Edge Cases)

1. On `/onboarding`, fill in all three fields but close the tab/browser without submitting.
2. Log in again.
3. **Expect**: the onboarding form is presented again, empty — no partial data was saved from the
   abandoned attempt.

## Scenario 5 — Invalid birth date is rejected (FR-005, Edge Cases)

1. On `/onboarding` (or later, editing from `/profile`), submit a future date.
2. **Expect**: `400 invalid_input`, previous value (if any) unchanged.
3. Repeat with an implausible date (e.g., an age of 200).
4. **Expect**: `400 invalid_input`.

## Scenario 6 — Google SSO first login is gated the same way (FR-007)

1. Sign in with Google using an account with no prior `Account` row (so 001 auto-creates one per
   FR-012).
2. **Expect**: after the Google callback completes, gated to `/onboarding` — identical treatment
   to a credentials-based login.

## Scenario 7 — Self-edit after onboarding (User Story 2, SC-004)

1. Log in with a skater account that has already completed onboarding.
2. Navigate to `/profile`.
3. **Expect**: `GET /skater-profile/me` returns the current nombre/apellido/fechaDeNacimiento,
   pre-filled and editable.
4. Change the nombre (or apellido, or fecha de nacimiento) to a new valid value and save.
5. **Expect**: `PUT /skater-profile/me` returns `200`, and the updated value is visible on the
   same page within 5 seconds without a manual reload (SC-004).

## Scenario 8 — Staff accounts are never gated (FR-008)

1. Log in with an `instructor` or `administrador` account.
2. **Expect**: lands directly on `/`, no redirect to `/onboarding`, and `GET /skater-profile/me`
   returns `403 forbidden` if called directly for that session.

## Scenario 9 — Multi-tab: completing onboarding in one tab unblocks another (Edge Cases)

1. Open two tabs with the same incomplete-profile skater session; both end up on `/onboarding`
   (or one on `/`, gated back to `/onboarding`).
2. Complete onboarding in tab A.
3. In tab B, attempt to navigate to `/`.
4. **Expect**: tab B's guard re-checks `GET /skater-profile/me` live and allows entry to `/` —
   it does not rely on any stale client-side "still incomplete" assumption from before tab A's
   submission.

## Success criteria checklist

- [X] SC-001 — onboarding completion to MainApp entry under 2 minutes (Scenario 1 — validated
      live via Docker Compose + a real browser session: register → verify email → login →
      redirected to `/onboarding` → submit → redirected to `/`, well under 2 minutes end to end)
- [~] SC-002 — 100% of incomplete-profile skaters (new or pre-existing) intercepted before
      reaching the MainApp (Scenarios 1, 2, 6). Scenario 1 validated live. Scenario 2
      (pre-existing account) is not distinguished by any code path from Scenario 1 — the gate
      reads live DB state, not account age — so it's covered by the same check; not re-run with
      a separately seeded row. Scenario 6 (Google SSO) needs a real Google OAuth2 client, which
      this environment doesn't have (same limitation noted in 001's own quickstart.md) — verified
      by code inspection instead: the Google callback redirects into the same `/` entry point
      that performs the gate check, so it goes through the identical code path as credential
      login.
- [X] SC-003 — 100% of attempts to reach the MainApp without completing all three fields are
      blocked (Scenarios 1 step 3-4, 3 — validated live: submitting the onboarding form with
      empty fields is blocked client-side with a message; `PUT /skater-profile/me` also rejects
      an empty `nombre` server-side with `400 invalid_input`, confirmed via curl after fixing a
      bug it surfaced — see Notes below)
- [X] SC-004 — a later self-edit is reflected on-screen within 5 seconds, no manual reload
      (Scenario 7 — validated live: edited `nombre` on `/profile`, "Cambios guardados." appeared
      immediately with no navigation/reload, backend log confirmed a `basic_info_updated` event
      distinct from the initial `basic_info_completed`)

## Notes from live validation

- **Bug found and fixed**: the original `saveSkaterBasicInfoRequestSchema` used
  `z.string().trim().min(1)` for `nombre`/`apellido`. Since the controller calls
  `.parse(body)` directly, an empty value threw an uncaught `ZodError` — not an `HttpException`
  — which the global exception filter reduced to an opaque `500 internal_error` instead of the
  documented `400 invalid_input`. Fixed by loosening the schema to `z.string()` and relying
  solely on `SaveMyBasicInfoUseCase`'s own validation (which already existed and already threw
  the correct `HttpException`) as the single source of truth for the non-empty business rule.
  Re-verified via curl after the fix: empty and whitespace-only `nombre` both now correctly
  return `400 invalid_input`.
- Also validated directly via curl: a future birth date, and an implausible age (215 years),
  both rejected with `400 invalid_input`; an unauthenticated request to `GET /skater-profile/me`
  returns `401 unauthenticated`; a rejected write leaves the previously-stored value untouched
  (FR-009).
- Scenario 8 (staff exclusion) and Scenario 9 (multi-tab) were not run live (no staff account
  readily seedable in this environment; multi-tab requires two coordinated sessions) — verified
  by code inspection: `SkaterSessionGuard` throws `403 forbidden` for any non-`skater` role
  before either use case runs, and every guard check (`MainAppPlaceholder`, `/onboarding`) calls
  `GET /skater-profile/me` live on each page load rather than caching prior state, so a second
  tab always sees the current server state.
