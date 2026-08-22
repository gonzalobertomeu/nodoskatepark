# Instructor Assignment Contracts: Promote, Invite, List, Cancel

Per Constitution Principle III, these are the abstractions to be defined first as typed contracts
in `packages/contracts/src/instructor-assignment/` (request/response shapes + error cases as
shared TypeScript + Zod schemas), then implemented by the NestJS backend and consumed by the
Astro/React frontend through the same contract.

Every endpoint below requires an authenticated `administrador` session specifically (via
`instructor-assignment`'s `CurrentSessionResolver` port + `AdminOnlySessionGuard` —
research.md #4). An `instructor` session is rejected here even though it's "staff" — FR-006 is
narrower than 002's staff-wide access.

The promotion **picker** itself is not a new endpoint: the frontend calls 002's existing,
unmodified `GET /skater-directory` directly (Clarifications).

All responses below are described at the contract level (shape + status), not literal wire JSON.

---

## `POST /instructor-assignment/existing/:accountId`

Promote an already-registered skater, selected from 002's listing (User Story 1).

**Request**: none (acts on the path `accountId`).

**Response (200)**:
```
{ status: "ok" } |
{ status: "no_op"; reason: "already_instructor" | "already_administrador" }
```
Neither variant is an HTTP error (research.md #3). On `{ status: "ok" }`, a
`RoleAssignmentAuditLog` row is appended with `method: "existing_user"` (FR-002, FR-014).

**Errors**:
- `401 unauthenticated` / `403 forbidden` — no session, or session role isn't `administrador`
  (FR-006).
- `404 not_found` — `accountId` doesn't resolve to any account.

---

## `POST /instructor-assignment/invite`

Reserve the instructor role for an email (User Story 2) — or, if that email already belongs to
an account, promote it directly instead (FR-010, User Story 2 Acceptance Scenario 3).

**Request**: `{ email: string }`

**Response (200)**:
```
{ status: "ok"; outcome: "invited" } |
{ status: "ok"; outcome: "promoted_existing" } |
{ status: "no_op"; reason: "already_instructor" | "already_administrador" | "invitation_already_pending" }
```
`outcome: "promoted_existing"` writes a `RoleAssignmentAuditLog` row with
`method: "existing_user"` — the effect is identical to the direct-promotion endpoint above, only
the input method differed (FR-010 treats it as equivalent, not a distinct case). `outcome:
"invited"` writes only the `InstructorInvitation` row — no audit-log row yet (FR-014's grant
audit happens at consumption, per data-model.md).

**Errors**:
- `401 unauthenticated` / `403 forbidden` — as above.
- `400 invalid_input` — malformed email (FR-012).

---

## `GET /instructor-assignment/invitations`

List pending invitations (User Story 3, FR-011). Only `status: "pending"` — not a full history.

**Response (200)**:
```
{
  items: Array<{
    id: string;
    email: string;
    createdByAdminId: string;
    createdAt: string; // ISO datetime
  }>;
}
```

**Errors**:
- `401 unauthenticated` / `403 forbidden` — as above.

---

## `POST /instructor-assignment/invitations/:invitationId/cancel`

Cancel a pending invitation (User Story 3).

**Response (200)**: `{ status: "ok" }`.

**Errors**:
- `401 unauthenticated` / `403 forbidden` — as above.
- `404 not_found` — `invitationId` doesn't resolve to a `pending` invitation (already
  cancelled/resolved, or never existed).
