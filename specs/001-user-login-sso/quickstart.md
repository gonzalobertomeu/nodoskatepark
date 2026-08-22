# Quickstart: Validating Login, SSO, Recovery & Registration

Manual/scripted validation scenarios proving the feature works end-to-end. Assumes the Nx
workspace, `apps/backend`, `apps/frontend`, and `packages/contracts` already exist (bootstrap is
tracked as setup tasks in `tasks.md`, not repeated here).

## Prerequisites

- Bun installed.
- A running PostgreSQL instance reachable via the backend's configured connection string.
- A Google OAuth2 client (client ID/secret) configured for local redirect URIs, for the SSO
  scenario only.
- `bun install` run at the repo root.

## Setup

```bash
bun run --cwd apps/backend --bun prisma migrate deploy --schema prisma/schema.prisma
bun nx serve backend   # http://localhost:3000
bun nx serve frontend  # http://localhost:4321
```

> Use `bun run --cwd apps/backend --bun prisma ...`, not `bunx prisma ...`, from the repo root —
> `bunx` resolves to the newest Prisma from the registry (currently a 7.x major with a breaking
> schema format) instead of the workspace-pinned `6.2.1` declared in `apps/backend/package.json`.

## Scenario 1 — Credential login (User Story 1, SC-001)

1. Open the frontend login view.
2. Register a test account first (see Scenario 4), or seed one directly via the backend.
3. Enter the correct email/password and submit.
4. **Expect**: redirected into the MainApp within the session established by a `Set-Cookie`
   response header from `POST /auth/login`; total time from opening the view to landing in the
   MainApp is under 30 seconds (SC-001).
5. Repeat with a wrong password.
6. **Expect**: `401 invalid_credentials`, generic error message, no indication of whether the
   email exists (FR-003).

## Scenario 2 — Google SSO (User Story 2, SC-002)

1. From the login view, click "Ingresar con Google".
2. Complete the Google consent screen with a test Google account.
3. **Expect**: redirected back through `GET /auth/google/callback` straight into the MainApp,
   session cookie set, in 3 or fewer user-facing interaction steps (SC-002).
4. Repeat, but click "Cancel" on Google's consent screen.
5. **Expect**: redirected back to the login view with a "sign-in did not complete" message; no
   session cookie set.

## Scenario 3 — Password recovery (User Story 3, SC-004)

1. From the login view, choose "Olvidé mi contraseña" and submit a registered email.
2. **Expect**: `200 { status: "ok" }` regardless of whether the email is registered (FR-007);
   confirm no timing/response difference between a registered and unregistered email.
3. Retrieve the reset token (from the test email adapter's captured output / logs in a dev
   environment).
4. Submit `POST /auth/password-reset/confirm` with the token and a new password.
5. Log in with the new password.
6. **Expect**: total elapsed time from receiving instructions to a successful login with the new
   password is under 5 minutes (SC-004).
7. Reuse the same (now-consumed) token.
8. **Expect**: `400 invalid_or_expired_token` (FR-008).

## Scenario 4 — Self-registration (User Story 4, SC-005)

1. From the login view, choose "Crear cuenta" and submit a new email + password.
2. **Expect**: `201`, account created with `role = "skater"` (FR-011), login blocked until email
   verification (FR-013).
3. Repeat registration with the same email.
4. **Expect**: `409 email_already_registered` (FR-010), no account details leaked.

## Scenario 5 — Deactivated account (FR-016)

1. Mark a test account's `status = "deactivated"` directly in the database (no UI for this in
   this feature — it belongs to an administrative feature).
2. Attempt to log in with that account's correct credentials, and separately via Google if
   linked.
3. **Expect**: `403 account_unavailable` for both methods, generic message, no distinction from
   a locked-out account.

## Scenario 6 — Lockout after repeated failures (FR-015, SC-006)

1. Attempt login with a valid email and a wrong password 5 times in a row.
2. **Expect**: the 5th (or any subsequent) attempt within the lockout window returns
   `403 account_unavailable`, even with the *correct* password.
3. Wait 15 minutes (or adjust `lockedUntil` directly in a test DB), then log in with the correct
   password.
4. **Expect**: success, and `failedAttempts` reset to 0.

## Scenario 7 — Auto-linking by email (FR-017)

1. Register a password-based account with `test@example.com`.
2. Sign in with Google using a Google account whose email is also `test@example.com`.
3. **Expect**: authenticated into the *same* account (no duplicate account created).
4. Attempt to self-register again with `test@example.com` via `POST /auth/register`.
5. **Expect**: `409 email_already_registered`.

## Success criteria checklist

- [X] SC-001 — credential login under 30s (validated via `POST /auth/login`; well under 30s for
      an API call — the 30s budget is dominated by human UI interaction, not backend latency)
- [~] SC-002 — Google login in ≤3 interaction steps (validated: `GET /auth/google` redirects to
      Google's consent screen with the right params, and a cancelled/failed callback redirects to
      `/login?auth_outcome=cancelled` with no session cookie set. The full success path needs a
      real Google OAuth2 client + interactive consent, which this environment doesn't have —
      re-run this leg with real credentials before shipping)
- [X] SC-003 — correct-credential logins succeed without system errors (10 repeated
      `POST /auth/login` calls against the same account all returned 200)
- [X] SC-004 — password reset + re-login under 5 minutes (validated end-to-end: request → dev
      email-capture token → confirm → login with new password → reused token rejected with
      `400 invalid_or_expired_token`)
- [X] SC-005 — registration to login-ready under 2 minutes (validated: register → 403 before
      verification → verify-email → login succeeds)
- [X] SC-006 — 100% of invalid/nonexistent-credential attempts rejected without leaking whether
      the email exists (wrong password and unknown email both return identical
      `401 invalid_credentials`; duplicate registration returns `409` with no account details)

Also validated directly: Scenario 5 (deactivated account → `403 account_unavailable` for
credential login) and Scenario 6 (5 failed attempts → locked; correct password still rejected
until `lockedUntil` elapses, then `failedAttempts` resets to 0). Scenario 7's auto-linking
(FR-017) was verified by code inspection of `login-with-google.use-case.ts` rather than a live
Google round-trip, for the same reason as SC-002.
