# Phase 1 Data Model: Asignación del Rol de Instructor por un Administrador

Derived from spec.md's Key Entities section and Functional Requirements. Two new tables, owned
and exclusively read/written by `instructor-assignment/infrastructure/persistence/`. `Account`
itself gains no new columns — this feature only ever writes its existing `role` column, through
the `AccountRoleWriter` port `auth` implements (research.md #1).

## InstructorInvitation

Represents the reservation of the instructor role for an email with no account yet. Corresponds
to spec.md's "Invitación de instructor pendiente."

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `email` | string | Normalized (trim + lowercase) before storage/comparison — research.md #5. Not unique at the DB level (a cancelled/resolved invitation for the same email must not block a new one — FR-009 only forbids a second *pending* one); uniqueness-among-pending is enforced at the application level, mirroring `auth`'s own precedent of application-level (not DB-constraint) email-uniqueness checks. |
| `createdByAdminId` | UUID | FK → `Account.id` (the granting administrador). |
| `status` | `"pending" \| "cancelled" \| "resolved"` | |
| `createdAt` | timestamp | |
| `resolvedAccountId` | UUID \| null | FK → `Account.id`. Set when a matching account is created (FR-004) — `null` until then. |
| `resolvedAt` | timestamp \| null | |
| `cancelledAt` | timestamp \| null | Set by User Story 3's cancel action. |

**Validation rules**:
- `email` MUST be a syntactically valid email address (FR-012).
- Creating a new invitation MUST be rejected if a `pending` invitation already exists for the
  same normalized email (FR-009) — application-level check, not a DB constraint (see above).
- Only a `pending` invitation may transition to `cancelled` (User Story 3) or `resolved` (FR-004)
  — a `cancelled` invitation is never later `resolved` by a subsequent registration (Edge Cases:
  "como si nunca hubiera existido la invitación").

**State transitions**: `pending → cancelled` (admin action) or `pending → resolved` (a matching
account is created) — both terminal; no further transitions.

## RoleAssignmentAuditLog

Represents one actual instructor-role grant (not an invitation being created — the two are
deliberately distinct entities). Corresponds to spec.md's "Registro de auditoría de asignación de
rol." Append-only; no read endpoint in this feature's scope (plan.md Constraints, mirroring
002's identical precedent for its health-conditions audit log).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `adminAccountId` | UUID | FK → `Account.id` — the administrador who granted the role. For the `email_invite` method, this is the admin who *created* the invitation, carried forward from `InstructorInvitation.createdByAdminId`, not necessarily whoever is logged in at consumption time (nobody is — consumption happens during someone else's registration). |
| `targetAccountId` | UUID \| null | FK → `Account.id`. Always set for `existing_user`; set for `email_invite` only once consumed (the row is written *at* consumption, per below, so in practice it is always set by the time the row exists). |
| `targetEmail` | string | Always present, regardless of method — self-contained audit trail without requiring a join. |
| `method` | `"existing_user" \| "email_invite"` | |
| `createdAt` | timestamp | The moment the role was actually granted — for `email_invite`, this is the account-creation/consumption moment (FR-004), **not** the earlier moment the invitation itself was created (FR-014 requires auditing the *assignment*, and the spec treats the invitation and the audited grant as two distinct entities with their own timestamps). |

**Validation rules**: One row per successful grant. FR-007/FR-008's no-op outcomes ("already
instructor"/"already administrador") do **not** write a row — no role change occurred.

**State transitions**: None — append-only, immutable once written.

## Relationships

```text
Account 1 ──── * InstructorInvitation      (as createdByAdminId — many invitations created per admin)
Account 1 ──── * InstructorInvitation      (as resolvedAccountId — at most one per resulting account, in practice)
Account 1 ──── * RoleAssignmentAuditLog    (as adminAccountId — many grants made per admin)
Account 1 ──── * RoleAssignmentAuditLog    (as targetAccountId — at most one per promoted account, in practice, since re-promoting an existing instructor is a no-op)
```

## Out of scope for this data model

- Any change to `Account`'s own columns — only its existing `role` value is written (via the
  `AccountRoleWriter` port), never a new field.
- A read/history view over `RoleAssignmentAuditLog` — explicitly out of scope (no FR or user
  story requires it; mirrors 002's identical precedent).
- Reverting `instructor` back to `skater`, demoting an `administrador`, or creating new
  `administrador` accounts — explicitly out of scope per spec.md's Assumptions.
