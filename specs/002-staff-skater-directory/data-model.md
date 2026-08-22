# Phase 1 Data Model: Listado y Perfil de Skaters para Staff

Derived from spec.md's Key Entities section and Functional Requirements. The three new fields
below are nullable columns on the existing `Account` row (mirroring 004's precedent of extending
the same row rather than a new 1:1 table) — owned and exclusively read/written by
`skater-directory/infrastructure/persistence/`. The `auth` and `skater-profile` modules' own
domain types are unchanged.

## Account (extended again)

Only the fields added by this feature are listed. See 001-user-login-sso's `data-model.md` for
the original fields, and 004-skater-onboarding's `data-model.md` for `nombre`/`apellido`/
`fechaDeNacimiento` — none of those are touched here; this feature only reads them, directly via
the shared Prisma client alongside its own columns (research.md #2), never writes them.

| Field | Type | Notes |
|---|---|---|
| `apodo` | string \| null | Free text. Editable by staff (FR-009). Shown in both listing and profile. |
| `afeccionesDeSalud` | string \| null | Free text. Editable by staff (FR-009). `null` (or an explicitly cleared value) renders as "sin afecciones declaradas" (FR-007). |
| `fotoPath` | string \| null | Relative path into the photo storage volume (research.md #1) — never the image bytes, never a public URL. `null` renders as an explicit placeholder (FR-006). Set only via `POST /skater-directory/:id/photo`, validated server-side (JPEG/PNG/WebP, ≤5MB — FR-013). |

**Validation rules**:
- `apodo` and `afeccionesDeSalud`, when set, are free text with no further format constraint
  (spec.md doesn't require one beyond FR-007's "empty ⇒ explicit placeholder" behavior).
- `fotoPath` is only ever written by the photo-upload use case after server-side validating the
  uploaded file's type and size; an invalid upload leaves the previous `fotoPath` (if any)
  unchanged (Edge Cases).
- `nombre`, `apellido`, `fechaDeNacimiento`, `email`, and any "último ingreso" value are **never**
  written by this feature's endpoints — the write contract for this module structurally has no
  field for any of them (FR-010).

**Who can write these fields**: any authenticated staff account (instructor or administrador),
via `PUT /skater-directory/:accountId` (`apodo`, `afeccionesDeSalud`) and
`POST /skater-directory/:accountId/photo` (`fotoPath`). No skater self-service path exists for
these three fields — that's out of this feature's scope entirely (contrast with `skater-profile`'s
`nombre`/`apellido`/`fechaDeNacimiento`, which *are* skater-self-service, per 004).

## SkaterHealthAuditLog

New table. Represents one edit event to a skater's `afeccionesDeSalud`, for audit/compliance
(FR-014) — never exposed through any read endpoint in this feature's scope (Clarifications).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `skaterAccountId` | UUID | FK → `Account.id` — whose health conditions changed. |
| `editedByAccountId` | UUID | FK → `Account.id` — which staff account made the change. |
| `editedAt` | timestamp | |

**Validation rules**: One row is appended on every successful `afeccionesDeSalud` write (including
setting it back to empty/null) — never updated or deleted.

**State transitions**: Append-only.

## Out of scope for this data model

- Any table backing "último ingreso al establecimiento" — that belongs to a future check-in/
  access-control feature (spec.md's Key Entities: "la creación de estos registros pertenece a
  otra funcionalidad ... fuera del alcance"). `skater-directory` only declares the
  `LastCheckInReader` port (research.md #2); nothing here backs it yet.
- The photo's binary content — lives on disk (research.md #1), not in Postgres; only `fotoPath`
  is a DB column.
- A read/history view over `SkaterHealthAuditLog` — explicitly out of scope per Clarifications
  (backend-only logging).

## Relationships

```text
Account 1 ──── * SkaterHealthAuditLog   (as skaterAccountId — many historical edits per skater)
Account 1 ──── * SkaterHealthAuditLog   (as editedByAccountId — many edits made per staff member)
```
