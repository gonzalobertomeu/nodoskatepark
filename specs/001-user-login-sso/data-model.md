# Phase 1 Data Model: Login Principal con Credenciales, Recuperación y SSO de Google

Derived from spec.md's Key Entities section and Functional Requirements. Lives in
`domain/entities/` as plain TypeScript classes/types — no ORM decorators (those belong to the
Prisma schema in `infrastructure/persistence/`, kept in sync with this model but not identical to
it).

## Account

Represents a person with access to the platform. Corresponds to spec.md's "Cuenta de usuario".

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary identifier. |
| `email` | string | Unique (case-insensitive). Enforced at the DB level (FR-010). |
| `passwordHash` | string \| null | Argon2id hash. `null` for accounts that only ever authenticated via Google (FR-017). |
| `googleId` | string \| null | Google account subject identifier, set once Google auth is linked (FR-017). |
| `role` | `"skater" \| "instructor" \| "administrador"` | Exactly one at all times (Constitution Principle VII). Defaults to `"skater"` on self-registration (FR-011). |
| `status` | `"active" \| "deactivated"` | Deactivated accounts are rejected at login regardless of method (FR-016). |
| `emailVerifiedAt` | timestamp \| null | Required non-null before first login for password-based signups (FR-013); set at creation time for Google-originated accounts. |
| `failedAttempts` | int | Consecutive failed login attempts; reset to 0 on success (FR-015). |
| `lockedUntil` | timestamp \| null | If set and in the future, login is blocked regardless of credential correctness (FR-015). |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Validation rules**:
- `email` MUST be a syntactically valid email address and unique across all accounts (FR-010).
- `passwordHash` and `googleId` MUST NOT both be `null` (an account needs at least one usable
  auth method).
- `role` MUST be one of the three enumerated values — no other value is valid (FR-005 of
  003-instructor-role-assignment, referenced here since this entity is shared across specs).

**State transitions**:
- `status`: `active → deactivated` and back, only through an administrative action outside this
  feature's scope (this feature only reads `status` to decide whether login is allowed).
- `failedAttempts`/`lockedUntil`: incremented on each failed login; both reset on a successful
  login (FR-015).
- `emailVerifiedAt`: `null → <timestamp>` once the user completes email verification (out of
  scope for *how* verification is delivered beyond FR-013's requirement that it gate first login).

## PasswordResetRequest

Represents a request to reset a forgotten password. Corresponds to spec.md's "Solicitud de
recuperación de contraseña".

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `accountId` | UUID | FK → `Account.id`. |
| `token` | string | Single-use, high-entropy random token (not the DB primary key, to avoid timing-based enumeration via `id`). |
| `expiresAt` | timestamp | Short-lived (implementation detail, e.g. 30–60 minutes; not specified by spec.md beyond "vencido"). |
| `status` | `"pending" \| "used" \| "expired"` | |
| `createdAt` | timestamp | |

**Validation rules**:
- A request is usable only while `status = "pending"` and `now() < expiresAt` (FR-008).
- Once consumed to set a new password, `status` MUST transition to `"used"` and MUST NOT be
  reusable (FR-008).

**State transitions**: `pending → used` (successful reset) or `pending → expired` (time-based,
evaluated at read time rather than requiring a background job).

## Session

Represents an authenticated user's active access to the MainApp. Corresponds to spec.md's
"Sesión".

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | The opaque token value handed to the client via the httpOnly cookie (see research.md #1). |
| `accountId` | UUID | FK → `Account.id`. |
| `authMethod` | `"password" \| "google"` | Which method produced this session (spec.md Session entity attribute). |
| `createdAt` | timestamp | |
| `expiresAt` | timestamp | Session TTL (implementation detail; industry-standard default per spec.md Assumptions). |
| `revokedAt` | timestamp \| null | Set on explicit logout or administrative deactivation; a non-null value invalidates the session immediately. |

**Validation rules**: A session is valid only if `revokedAt IS NULL` and `now() < expiresAt`.
Every authenticated request re-checks the associated `Account.status` (FR-016) — a session
cannot outlive its account being deactivated.

## Relationships

```text
Account 1 ──── * PasswordResetRequest   (an account may have many historical requests)
Account 1 ──── * Session                (an account may have many concurrent/historical sessions)
```

## Out of scope for this data model

- Any field beyond what login/registration/recovery/SSO need (name, apellido, apodo, foto,
  afecciones de salud, etc. belong to `002-staff-skater-directory`'s "Perfil de skater", which
  extends this same `Account` row but is owned by that feature).
- The `InstructorInvitation` and role-grant audit-log entities from `003-instructor-role-assignment`.
