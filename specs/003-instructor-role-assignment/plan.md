# Implementation Plan: Asignación del Rol de Instructor por un Administrador

**Branch**: `003-instructor-role-assignment` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-instructor-role-assignment/spec.md`

## Summary

An administrador promotes an existing skater to instructor (picked from 002's existing,
unmodified skater-only listing) or reserves the role for an email with no account yet
(auto-applied at account creation, replacing the default skater role). Every grant is audited
(who, target, method, when). Technical approach: a new `instructor-assignment` NestJS module
(module-first Clean Architecture, per Constitution II) owns two new tables —
`InstructorInvitation` and `RoleAssignmentAuditLog` — and reads `Account.role`/`email`/`status`
through a *local* port (`AccountLookup`) it declares and implements itself, backed by the shared
Prisma client (extending 002's precedent: reads of another module's display/identity data don't
need a *cross-module* port; only writes and owned behavior do). Writing the actual role change
goes through a real cross-module port, `AccountRoleWriter`, that `instructor-assignment` declares
and `auth` implements — `auth` remains the sole writer of `Account.role`. The reverse direction —
001's existing `RegisterAccountUseCase`/`LoginWithGoogleUseCase` needing to know about pending
invitations at account-creation time (FR-004) — is deliberately **not** a second, opposite-facing
port (that would create a circular module dependency between `auth` and
`instructor-assignment`). Instead, `auth` emits an `account.created` domain event (via
`@nestjs/event-emitter`, awaited synchronously) after creating a new account; `instructor-
assignment` listens and applies a matching pending invitation through the same `AccountRoleWriter`
path, keeping the dependency one-directional (`instructor-assignment → auth`) either way. There
is no separate "admin app" to build: FR-013's shared administration application is the same
`apps/frontend` Astro app's growing set of staff-gated pages (002's `/skaters`, and this
feature's new pages), not a distinct frontend.

## Technical Context

**Language/Version**: TypeScript 5.x, running on Bun 1.x (same toolchain as 001/002/004).

**Primary Dependencies**:
- Backend: NestJS (new `instructor-assignment` module), Prisma (two new tables, no new `Account`
  columns), `@nestjs/event-emitter` (new — the `account.created` domain event bridging `auth` →
  `instructor-assignment` without a circular module import).
- Frontend: Astro, React 18+ (new admin-only page reusing 002's `skaterDirectoryClient.listSkaters`
  for the promotion picker, per Clarifications).
- Shared: `packages/contracts/src/instructor-assignment/` (new contract module), Zod.

**Storage**: PostgreSQL — two new tables, no changes to `Account`'s columns (only its existing
`role` value is written, via the port below):
- `instructor_invitations`: email, creating admin, status (pending/cancelled/resolved), resolved
  account (nullable, set on consumption), timestamps.
- `role_assignment_audit_log`: granting admin, target account (nullable until an invite is
  consumed) + target email (always present), method (`existing_user`/`email_invite`), timestamp
  — written at the moment the role is actually granted, not when an invitation is created
  (FR-014; the two entities are deliberately distinct, per spec.md's Key Entities).

**Testing**: `bun test`, consistent with the precedent set by 001/002/004 (no dedicated test
tasks unless requested).

**Target Platform**: Same Linux containers (Docker Compose) as 001/002/004 — no new sub-app, no
new volume (unlike 002, nothing binary is stored here).

**Project Type**: Web application monorepo (unchanged) — a new backend module inside the
existing `apps/backend`, one new admin-only page inside the existing `apps/frontend`, one new
contract module inside the existing `packages/contracts`.

**Performance Goals**: Same order of magnitude as 001/002/004 — endpoints respond within ~300ms
p95 at the documented scale (tens to a few thousand accounts). SC-001/SC-002 (promote/invite in
under 30s) are human-interaction budgets, validated in `quickstart.md`, not raw-throughput
targets.

**Constraints**:
- FR-006 restricts every write in this feature to `administrador` sessions specifically — a
  *stricter* gate than 002's staff guard (which also allows `instructor`). A new
  `AdminOnlySessionGuard` is needed; it reuses the same `CurrentSessionResolver`-port pattern
  002/004 already established (a third independently-declared instance, implemented by `auth`),
  not a new mechanism.
- Per Clarifications, the promotion picker (FR-001) reuses 002's existing `GET /skater-directory`
  listing **unmodified** — no new listing endpoint. FR-007/FR-008's "already instructor"/"already
  administrador" checks are real, independently-testable backend guards, but are unreachable via
  normal UI browsing (the picker structurally never surfaces a non-skater account); they only
  matter for direct API access or future UI changes.
- FR-007/FR-008 are explicitly **not** modeled as HTTP errors — spec.md frames both as
  "no realiza el cambio e informa" (informational, not an error). Responses use a distinct
  `no_op` outcome with a `reason`, not a 4xx status.
- FR-004's registration-time role assignment must complete **before** the HTTP response returns
  (SC-003's "sin intervención manual" + 001's session/role-freshness guarantee depend on this) —
  the `account.created` event is emitted via `emitAsync` and awaited, not fire-and-forget.
- Invitation-email matching/uniqueness (FR-009, FR-010) is case-insensitive, mirroring `auth`'s
  existing `normalizeEmail` convention for `Account.email`.
- No audit-log read endpoint is built — spec.md defines the entity and requires it be recorded,
  but no user story or FR requires viewing it, mirroring 002's identical precedent for its
  health-conditions audit log.

**Scale/Scope**: Same skatepark scale as 001/002/004 (tens to a few thousand accounts, a small
number of administrador accounts performing occasional grants).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Bun-First Runtime & Tooling | New module and frontend page build/run/test on the existing Bun toolchain; no new runtime. | PASS |
| II. Module-First Clean Architecture Layering | New `instructor-assignment` module fully self-contained under `apps/backend/src/modules/instructor-assignment/{domain,application,infrastructure}/`. Two cross-module ports (`AccountRoleWriter` and a third `CurrentSessionResolver` instance), both declared by `instructor-assignment`, implemented+exported by `auth` — a single direction, no circular module import (the reverse direction uses a domain event, not a port). Reads of `Account.role`/`email`/`status` go through a local port (`AccountLookup`) `instructor-assignment` both declares and implements itself via the shared Prisma client, per 002's established precedent for shared-table display data. `domain/` has zero NestJS/Prisma imports. | PASS |
| III. Contracts as Source of Truth | All new endpoints defined in `packages/contracts/src/instructor-assignment/` before implementation (Phase 1 output). | PASS |
| IV. Isolated, Containerized Sub-Apps | No new sub-app, Dockerfile, or volume — reuses `apps/backend`'s existing container. | PASS |
| V. Monorepo Tooling Consistency (Nx + Biome) | New module/page live inside the existing `apps/backend`/`apps/frontend` Nx projects; no new Nx project, same Biome config. | PASS |
| VI. Neobrutalist Design System & Brand Palette | The new admin page reuses the existing neobrutalist tokens/components — no new colors. | PASS |
| VII. Ubiquitous Role Language | Uses `skater`/`instructor`/`administrador`/`staff` exclusively; FR-006 enforces `administrador`-only access, a precise subset of "staff" — no new role terminology. | PASS |
| VIII. Resend as the Sole Email Delivery Provider | This feature sends no email (spec.md Assumptions: an invitation "no vence ni genera una notificación automática") — the principle isn't implicated. | N/A |

No violations identified. **Complexity Tracking is not needed.**

**Post-Phase 1 re-check**: `data-model.md` keeps both new tables under
`instructor-assignment/infrastructure/persistence/`, with `auth`'s own `Account`/domain types
untouched — only its `role` column is written, through the `AccountRoleWriter` port `auth`
implements. The `account.created` event's payload type lives in `src/shared/events/`, not in
either module's own `domain/` — neither module owns it, matching Constitution II's `src/shared/`
carve-out and keeping `auth`'s emit call from ever importing anything under
`instructor-assignment/`. The `@nestjs/event-emitter` dependency introduces no framework types
into either module's `domain/`. `contracts/instructor-assignment-endpoints.md` introduces no
endpoint outside `packages/contracts/src/instructor-assignment/`'s ownership. All rows above
still PASS after
design; no re-evaluation changes.

## Project Structure

### Documentation (this feature)

```text
specs/003-instructor-role-assignment/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── instructor-assignment-endpoints.md
└── tasks.md               # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Extends the existing monorepo skeleton (001) and reuses 002's skater listing as-is — no new
sub-app.

```text
apps/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             # add `InstructorInvitation`, `RoleAssignmentAuditLog`
│   │                                  #   (no changes to `Account`'s columns)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── application/
│   │   │   │   │   ├── use-cases/
│   │   │   │   │   │   ├── register-account.use-case.ts        # MODIFIED — emits
│   │   │   │   │   │   │                                        #   account.created (awaited)
│   │   │   │   │   │   └── login-with-google.use-case.ts        # MODIFIED — same, only on
│   │   │   │   │   │                                             #   the new-account branch
│   │   │   │   └── infrastructure/
│   │   │   │       └── instructor-assignment-bridge/  # AccountRoleWriter + a third
│   │   │   │                                            #   CurrentSessionResolver adapter,
│   │   │   │                                            #   exported by auth.module.ts
│   │   │   └── instructor-assignment/                  # NEW module (this feature)
│   │   │       ├── domain/
│   │   │       │   ├── entities/                        # InstructorInvitation,
│   │   │       │   │                                     #   RoleAssignmentAuditEntry
│   │   │       │   └── ports/                            # InstructorInvitationRepository,
│   │   │       │                                          #   RoleAssignmentAuditRepository,
│   │   │       │                                          #   AccountLookup (local — reads),
│   │   │       │                                          #   AccountRoleWriter (cross-module —
│   │   │       │                                          #   write), CurrentSessionResolver
│   │   │       ├── application/
│   │   │       │   └── use-cases/                        # PromoteExistingUserToInstructor,
│   │   │       │                                          #   AssignInstructorByEmail,
│   │   │       │                                          #   CancelInstructorInvitation,
│   │   │       │                                          #   ListPendingInstructorInvitations,
│   │   │       │                                          #   ConsumePendingInvitationOnAccountCreated
│   │   │       ├── infrastructure/
│   │   │       │   ├── http/                              # POST .../existing/:accountId,
│   │   │       │   │                                       #   POST .../invite,
│   │   │       │   │                                       #   GET/POST .../invitations[...]
│   │   │       │   ├── persistence/                        # Prisma-backed repositories,
│   │   │       │   │                                        #   incl. PrismaAccountLookup
│   │   │       │   │                                        #   (reads Account.role/email/
│   │   │       │   │                                        #   status — research.md #2)
│   │   │       │   └── events/                              # @OnEvent('account.created')
│   │   │       │                                             #   listener
│   │   │       └── instructor-assignment.module.ts
│   │   └── shared/
│   │       └── events/                                       # NEW — AccountCreatedEvent
│   │                                                          #   (payload type) + the event
│   │                                                          #   name constant; owned by
│   │                                                          #   neither module (Constitution
│   │                                                          #   II's src/shared/ carve-out),
│   │                                                          #   since auth (the emitter)
│   │                                                          #   importing something owned by
│   │                                                          #   instructor-assignment's own
│   │                                                          #   domain/ would be exactly the
│   │                                                          #   cross-module import this
│   │                                                          #   event was designed to avoid
│   └── test/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── instructors.astro     # NEW — admin-only: promote/invite/pending invitations
│   │   ├── components/
│   │   │   └── InstructorAssignmentView.tsx  # NEW — reuses skaterDirectoryClient.listSkaters
│   │   │                                      #   for the promotion picker (Clarifications)
│   │   └── services/
│   │       └── instructor-assignment-client.ts  # NEW — typed client, mirrors existing clients
│
packages/
└── contracts/
    └── src/
        └── instructor-assignment/
            └── assignment.contract.ts  # promote/invite/list/cancel + Zod schemas
```

**Structure Decision**: Same Nx monorepo (Constitution "Option 2" shape) as 001/002/004. This
feature adds one new backend module (`instructor-assignment`, module-first Clean Architecture
per Principle II), one new admin-only frontend page/component, and one new contract module — no
new sub-app, Dockerfile, or Nx project. The only changes inside `auth` are: a small bridge
adapter (`AccountRoleWriter` + a third `CurrentSessionResolver` instance) and two existing
use-case files gaining one awaited event emission each; `auth`'s own domain/application logic
and every other module (`skater-profile`, `skater-directory`) are untouched.

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
