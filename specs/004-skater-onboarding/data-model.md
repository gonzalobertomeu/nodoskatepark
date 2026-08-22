# Phase 1 Data Model: Onboarding de Datos Básicos del Skater

Derived from spec.md's Key Entities section and Functional Requirements. The three fields below
are new nullable columns on the existing `Account` row (001-user-login-sso's `data-model.md`
already reserved this extension point) — not a new table. They live in
`skater-profile/domain/entities/` as a plain TypeScript type, read/written only by
`skater-profile/infrastructure/persistence/`; the `auth` module's own `Account` domain type is
unchanged.

## Account (extended)

Only the fields added by this feature are listed; see 001-user-login-sso's `data-model.md` for
the rest of `Account` (`id`, `email`, `passwordHash`, `googleId`, `role`, `status`,
`emailVerifiedAt`, `failedAttempts`, `lockedUntil`, `createdAt`, `updatedAt`), all of which are
untouched by this feature.

| Field | Type | Notes |
|---|---|---|
| `nombre` | string \| null | `null` until the skater completes onboarding (FR-002). Free text, non-empty when set (Assumptions). |
| `apellido` | string \| null | Same as `nombre`. |
| `fechaDeNacimiento` | Date \| null | `null` until onboarding. MUST NOT be a future date and MUST fall within a realistic age range when set (FR-005). |

**Validation rules**:
- `nombre` and `apellido`, when set, MUST be non-empty (after trimming).
- `fechaDeNacimiento`, when set, MUST NOT be in the future and MUST correspond to an age between
  5 and 100 years (research.md #4) — a sanity bound, not a business minimum-age policy.
- These three fields are only ever written together, as a single atomic `PUT` (FR-009) — there is
  no code path that persists just one or two of them.

**Derived state**:
- `complete` (not a stored column — computed on read): `true` when `nombre`, `apellido`, and
  `fechaDeNacimiento` are all non-null; `false` otherwise. This is what `002-staff-skater-directory`
  reads to decide whether to show its "perfil incompleto" placeholder (FR-015 of 002), and what
  this feature's own gate reads to decide whether to redirect to `/onboarding` (FR-002).

**Who can write these fields**:
- The skater themself, via `PUT /skater-profile/me` — both the first (onboarding) submission and
  any later edit (User Story 2) use the identical operation and validation rules.
- Nobody else: 002-staff-skater-directory's own FR-010 already forbids staff from editing
  `nombre`/`apellido`/`fecha de nacimiento`/`edad` through that feature; this feature does not
  introduce any staff-facing write path either.

**State transitions**:
- `null → <value>` for each of the three fields, all at once, on the first successful
  `PUT /skater-profile/me` (onboarding completion).
- `<value> → <new value>` on any later successful `PUT /skater-profile/me` (self-edit, User Story
  2) — never back to `null` (there is no "clear my profile" operation in this feature's scope).

## Relationships

```text
Account 1 ──── 1 (nombre, apellido, fechaDeNacimiento)   — same row, not a separate entity
```

## Out of scope for this data model

- Any other field of `002-staff-skater-directory`'s "Perfil de skater" (apodo, foto, afecciones
  de salud) — owned and added by that feature, not this one.
- A minimum-admission-age or parental-consent field/flow — explicitly out of scope (spec.md
  Assumptions).
- A history/audit table for edits to these three fields — unlike 002's health-conditions edits
  (FR-014 of 002), this spec does not require an audit trail for name/birth-date changes.
