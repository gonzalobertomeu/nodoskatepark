# Quickstart: Validating Instructor Role Assignment

Manual/scripted validation scenarios proving the feature works end-to-end. Assumes
001-user-login-sso and 002-staff-skater-directory are already implemented and running — this
feature reuses 002's listing unmodified and extends two of 001's existing use cases.

## Prerequisites

- Bun installed; the same running PostgreSQL instance used by 001/002/004.
- `bun install` run at the repo root.
- At least one `administrador` account, seeded directly in the DB (no self-service admin signup
  exists — same precedent as 002's staff account for its own quickstart).
- At least one existing skater account (to promote directly) and one email with no account yet
  (to invite).

## Setup

```bash
bun run --cwd apps/backend --bun prisma migrate deploy --schema prisma/schema.prisma
bun nx serve backend   # http://localhost:3000
bun nx serve frontend  # http://localhost:4321
```

## Scenario 1 — Promote an existing skater (User Story 1, SC-001)

1. Log in as `administrador`, open `/instructors`, search for the seeded skater by name (reuses
   002's `GET /skater-directory` — Clarifications) and click "Promover."
2. **Expect**: `POST /instructor-assignment/existing/:accountId` returns
   `200 { status: "ok" }`; total time from finding the user to confirming the promotion is under
   30 seconds (SC-001).
3. Log in as that (now-promoted) account.
4. **Expect**: `GET /auth/session` returns `role: "instructor"`; the account no longer appears in
   002's skater-only listing (it's no longer a skater).

## Scenario 2 — Attempt to re-promote an already-instructor or already-administrador account (Edge Cases, FR-007, FR-008)

1. Call `POST /instructor-assignment/existing/:accountId` again for the account promoted in
   Scenario 1 (already `instructor`).
2. **Expect**: `200 { status: "no_op", reason: "already_instructor" }` — not an error
   (research.md #3).
3. Repeat against a seeded `administrador` account's id.
4. **Expect**: `200 { status: "no_op", reason: "already_administrador" }`.
5. Note: neither case is reachable by browsing `/instructors` normally — the picker only ever
   lists skaters (Clarifications) — so this scenario is validated directly via the API, not the
   UI, consistent with FR-007/FR-008 being a backend-only guard in current-scope usage.

## Scenario 3 — Invite an email with no account (User Story 2, SC-002)

1. On `/instructors`, enter an email with no existing account and submit the invite form.
2. **Expect**: `POST /instructor-assignment/invite` returns
   `200 { status: "ok", outcome: "invited" }`; total time under 30 seconds (SC-002).
3. Register a new account with that exact email via 001's standard `/register` flow (or Google
   SSO), completing email verification if applicable.
4. **Expect**: the resulting account has `role: "instructor"`, not the default `skater`
   (FR-004, SC-003) — confirmed via `GET /auth/session` after logging in — and the invitation
   used above now has `status: "resolved"`.

## Scenario 4 — Inviting an email that already has an account (User Story 2 Acceptance Scenario 3, FR-010)

1. On `/instructors`, enter the email of an *existing* skater account (not select it from the
   picker) and submit the invite form.
2. **Expect**: `200 { status: "ok", outcome: "promoted_existing" }` — the account is promoted
   directly; no `InstructorInvitation` row is created.

## Scenario 5 — Duplicate pending invitation (FR-009)

1. Invite an email with no account (as in Scenario 3), but don't let it be consumed.
2. Submit the same email again via the invite form.
3. **Expect**: `200 { status: "no_op", reason: "invitation_already_pending" }` — no second
   invitation row created.

## Scenario 6 — Cancel a pending invitation (User Story 3)

1. Create an invitation for an email (Scenario 3), then open the pending-invitations list on
   `/instructors` (`GET /instructor-assignment/invitations`).
2. **Expect**: the invitation appears with its email and creation date.
3. Cancel it.
4. **Expect**: `POST /instructor-assignment/invitations/:invitationId/cancel` returns
   `200 { status: "ok" }`; it no longer appears in the pending list.
5. Register a new account with that same email.
6. **Expect**: the account gets the default `skater` role, not `instructor` — the cancelled
   invitation has no effect (Edge Cases).

## Scenario 7 — Invalid email format (FR-012)

1. Submit the invite form with a malformed email (e.g., `not-an-email`).
2. **Expect**: `400 invalid_input`, no invitation created.

## Scenario 8 — Access control (FR-006, SC-004)

1. Log in as a `skater` account, attempt `GET /instructor-assignment/invitations` and
   `POST /instructor-assignment/existing/:accountId` directly.
2. **Expect**: both return `403 forbidden`.
3. Repeat as an `instructor` account (staff, but not administrador).
4. **Expect**: both still return `403 forbidden` — this feature is `administrador`-only, stricter
   than 002's staff-wide access (research.md #4).

## Success criteria checklist

- [X] SC-001 — promote an existing user in under 30 seconds (Scenario 1)
- [X] SC-002 — create an email invitation in under 30 seconds (Scenario 3)
- [X] SC-003 — 100% of registrations with a pending (non-cancelled) invitation get the
      instructor role automatically, no manual step (Scenario 3)
- [X] SC-004 — 100% of non-administrador attempts to assign the instructor role are blocked
      (Scenario 8)
- [X] SC-005 — every account always has exactly one of the three roles (implicit in Scenarios
      1–4: no scenario ever results in zero or multiple roles, since role is a single enum
      column on `Account`, unchanged by this feature's schema)

All 8 scenarios validated live on 2026-08-21 via Docker Compose (curl for the API, Claude in
Chrome for the `/instructors` UI). One bug found and fixed during validation: the
`promoteExisting` and `invite` controller endpoints were returning NestJS's default `201` instead
of the contracted `200` (missing `@HttpCode(HttpStatus.OK)`) — fixed in
`instructor-assignment.controller.ts`.
