# Phase 1 Data Model: Listado de Staff

Derived from spec.md's Key Entities section and Functional Requirements. No new table and no new
column — this feature only ever *reads* the existing `Account` row, scoped to
`role IN ('instructor', 'administrador')`, via the local `StaffDirectoryRepository` port
(research.md #2).

## StaffListEntry

Represents one row of the staff listing. Corresponds to spec.md's "Cuenta de staff." Not a
persisted entity of its own — a read projection over the existing `Account` table.

| Field | Type | Notes |
|---|---|---|
| `accountId` | UUID | `Account.id`. |
| `nombre` | string \| null | `Account.nombre`. `null` when the account never completed
  004-skater-onboarding's profile step — that step is exclusive to skaters, so any staff account
  that reached `instructor`/`administrador` without ever having been a skater who onboarded
  (e.g., promoted immediately after registering, or created via an email invitation and never
  onboarded) has this unset. Rendered as "perfil incompleto" (FR-004), never a blank cell. |
| `apellido` | string \| null | Same as `nombre` above. |
| `email` | string | `Account.email` — always present (set at registration, 001). |
| `role` | `"instructor" \| "administrador"` | `Account.role`, restricted to these two values by
  the repository's query filter (FR-003) — `skater` rows are structurally excluded, never
  filtered client-side. |
| `status` | `"active" \| "deactivated"` | `Account.status` (FR-005). |

**Validation rules**: None — this is a read-only projection; no data is written by this feature
(FR-008).

**State transitions**: None — `staff-directory` never changes `Account.role`/`status`/`nombre`/
`apellido`; all of those remain owned and written by other features (`auth`, 004, 003).

## Out of scope for this data model

- Any new table, column, or write path — this feature is 100% read-only (FR-008).
- `InstructorInvitation` rows (003) — a pending invitation has no `Account` row yet, so it can
  never appear as a `StaffListEntry` (FR-009).
- Pagination metadata (`page`/`pageSize`/`total`) — deliberately omitted, see research.md #3.
