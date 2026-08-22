# Skater Profile Contracts: Basic Info (Onboarding + Self-Edit)

Per Constitution Principle III, these are the abstractions to be defined first as typed contracts
in `packages/contracts/src/skater-profile/` (request/response shapes + error cases as shared
TypeScript + Zod schemas), then implemented by the NestJS backend and consumed by the Astro/React
frontend through the same contract — no hand-duplicated types on either side.

Both endpoints require an authenticated `skater`-role session (via `skater-profile`'s
`CurrentSessionResolver` port, backed by `auth`'s existing session cookie — see research.md #2).
Neither endpoint is reachable by `instructor`/`administrador` accounts (FR-008).

All responses below are described at the contract level (shape + status), not as literal wire
JSON — exact serialization is an implementation detail of the contract package.

---

## `GET /skater-profile/me`

Reads the current skater's own basic info (User Story 1 gate check, User Story 2 profile view).

**Request**: none (acts on the current session cookie).

**Response (200)**:
```
{
  nombre: string | null;
  apellido: string | null;
  fechaDeNacimiento: string | null; // ISO date
  complete: boolean; // true iff all three are non-null
}
```

**Errors**:
- `401 unauthenticated` — no valid session (mirrors `auth`'s existing convention; distinct from
  `GET /auth/session`'s always-200 shape, since this endpoint has nothing meaningful to return
  without an account).
- `403 forbidden` — authenticated as `instructor`/`administrador` (FR-008): this endpoint is
  skater-only.

---

## `PUT /skater-profile/me`

Sets the current skater's `nombre`, `apellido`, and `fechaDeNacimiento` — used identically for
the first (onboarding) submission and any later self-edit (User Story 1 completion, User Story 2
edit). All three fields are required on every call (research.md #1, FR-009): there is no
partial-update variant.

**Request**:
```
{
  nombre: string;              // non-empty after trim
  apellido: string;            // non-empty after trim
  fechaDeNacimiento: string;   // ISO date; not future; realistic age (FR-005)
}
```

**Response (200)**: `{ status: "ok" }` — the now-complete profile.

**Errors**:
- `401 unauthenticated` — no valid session.
- `403 forbidden` — authenticated as staff (FR-008).
- `400 invalid_input` — any field missing/empty, or `fechaDeNacimiento` is in the future or
  outside the realistic-age sanity bound (FR-005). The previous values (if any) are left
  unchanged — no partial write ever occurs (FR-009).
