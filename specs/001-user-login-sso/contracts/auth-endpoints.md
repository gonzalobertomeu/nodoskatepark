# Auth Contracts: Login, SSO, Recovery, Registration

Per Constitution Principle III, these are the abstractions to be defined first as typed contracts
in `packages/contracts/src/auth/` (request/response shapes + error cases as shared TypeScript +
Zod schemas), then implemented by the NestJS backend and consumed by the Astro/React frontend
through the same contract — no hand-duplicated types on either side.

All responses below are described at the contract level (shape + status), not as literal wire
JSON — exact serialization is an implementation detail of the contract package.

---

## `POST /auth/login`

Credential login (User Story 1).

**Request**: `{ email: string; password: string }`

**Response (200)**: sets the session cookie; body confirms success (no session token in the
body — it lives only in the httpOnly cookie). `{ status: "ok" }`

**Errors**:
- `401 invalid_credentials` — wrong password, unknown email, or account not found (FR-003;
  deliberately identical for all three so email existence is never leaked).
- `403 account_unavailable` — account is deactivated (FR-016) or currently locked out (FR-015).
  Body MUST NOT distinguish "deactivated" from "locked" or reveal `lockedUntil`.

---

## `GET /auth/google`

Starts the Google SSO redirect flow (User Story 2). No request body — a browser navigation, not
an API call consumed via the typed client. Redirects to Google's consent screen.

## `GET /auth/google/callback`

Google's OAuth2 redirect target.

**Behavior**:
- On success: resolves/creates the `Account` per FR-005/FR-012/FR-017, sets the session cookie,
  redirects the browser to the MainApp entry point.
- On failure/cancellation (user denies consent): redirects back to the login view with a query
  flag the frontend maps to the "login did not complete" message (User Story 2, scenario 2).
- On `account_unavailable` (deactivated account resolved by email — FR-016): redirects back to
  login with the same generic unavailable-account messaging as `POST /auth/login`.

---

## `POST /auth/register`

Self-registration (User Story 4).

**Request**: `{ email: string; password: string }`

**Response (201)**: `{ status: "ok"; emailVerificationRequired: true }` — role is always
`skater` (FR-011); account is created but cannot log in until `emailVerifiedAt` is set (FR-013),
unless an instructor invitation for this email is later formalized by
`003-instructor-role-assignment` (out of scope here; FR-004 of that spec still applies whenever
this endpoint creates the account).

**Errors**:
- `409 google_account_exists` — email already belongs to an existing account that authenticates
  via Google only (`googleId` set, no `passwordHash`). Per FR-017, the response MUST direct the
  user to sign in with Google instead, distinct from the generic conflict below.
- `409 email_already_registered` — email already belongs to an existing password-based account
  (FR-010). Body MUST NOT expose further account details.
- `400 invalid_input` — malformed email or password not meeting policy (policy detail deferred to
  implementation; contract only guarantees the error shape).

---

## `POST /auth/password-reset/request`

Start password recovery (User Story 3).

**Request**: `{ email: string }`

**Response (200)**: always `{ status: "ok" }` regardless of whether the email exists (FR-007) —
this is a deliberate non-distinguishing response, not an omission.

---

## `POST /auth/password-reset/confirm`

Complete password recovery.

**Request**: `{ token: string; newPassword: string }`

**Response (200)**: `{ status: "ok" }`.

**Errors**:
- `400 invalid_or_expired_token` — token not found, already used, or past `expiresAt` (FR-008).

---

## `POST /auth/logout`

**Request**: none (acts on the current session cookie).

**Response (200)**: `{ status: "ok" }`; clears the session cookie and sets `Session.revokedAt`.

---

## `GET /auth/session`

Used by the frontend to check whether the current cookie still represents a valid session (e.g.,
on MainApp load, or to decide whether to redirect back to `/login`).

**Response (200)**: `{ authenticated: true; role: "skater" | "instructor" | "administrador" }`

**Response (200, unauthenticated)**: `{ authenticated: false }` — not a 401, since "no session"
is an expected, valid state for this endpoint rather than an error.
