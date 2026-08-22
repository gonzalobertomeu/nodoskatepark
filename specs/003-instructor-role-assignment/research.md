# Phase 0 Research: Asignación del Rol de Instructor por un Administrador

All items below were left open by the Technical Context (which fixes runtime, frameworks, and
general architecture via 001/002/004's precedent, but not this feature's own design choices).
Each is resolved here so Phase 1 design has no outstanding unknowns.

## 1. Registration-time role assignment (FR-004) without a circular module dependency

**Decision**: `auth`'s `RegisterAccountUseCase` and `LoginWithGoogleUseCase` (only on the branch
that creates a brand-new account) emit an `account.created` domain event — `{ accountId, email }`
— via `@nestjs/event-emitter`'s `emitAsync`, **awaited** before the use case returns. The event's
payload type and name constant live in `apps/backend/src/shared/events/`, not in either module's
own `domain/` — neither `auth` nor `instructor-assignment` owns this shape exclusively
(Constitution II's `src/shared/` carve-out), which matters precisely because `auth` is the one
emitting it: if the type lived under `instructor-assignment/domain/`, `auth` importing it would
itself be the cross-module file import this whole design exists to avoid.
`instructor-assignment` registers an `@OnEvent('account.created')` listener that checks for a
matching pending `InstructorInvitation` and, if found, assigns the instructor role through the
same `AccountRoleWriter` port used for direct promotion, then marks the invitation resolved and
writes the audit-log row (method `email_invite`).

**Rationale**: `instructor-assignment` already needs one port from `auth`
(`AccountRoleWriter`, for FR-001/FR-002/FR-010's direct-promotion paths) — that's
`instructor-assignment → auth`. FR-004 needs the *opposite* direction: `auth`'s own
account-creation code needs to know about `instructor-assignment`'s data. Declaring a second,
reverse-facing port (e.g., `auth` declaring a `PendingRoleResolver` implemented by
`instructor-assignment`) would require `auth.module.ts` to import `InstructorAssignmentModule`
while `InstructorAssignmentModule` already imports `AuthModule` — a circular module dependency.
NestJS can technically work around that with `forwardRef()`, but it's exactly the kind of fragile
coupling Constitution II's module-boundary goal is meant to prevent. A domain event keeps the
dependency graph one-directional either way: `auth` only depends on the shared
`EventEmitterModule` (already a valid `src/shared/`-style cross-cutting concern), never on
`instructor-assignment` directly.

Using `emitAsync` (awaited) rather than fire-and-forget `emit` is required, not optional: FR-004
says the account "DEBE" have the instructor role "en el momento de su creación," and SC-003
requires 100% of matching registrations to get the role "sin intervención manual." A fire-and-
forget event could let the HTTP response (and therefore the user's very first `GET
/auth/session` call) race ahead of the role assignment, observing `skater` instead of
`instructor` for a brief window. Awaiting the event closes that window entirely.

**Alternatives considered**:
- *Reverse port (`auth` declares, `instructor-assignment` implements)*: rejected — circular
  module import, as above.
- *Fire-and-forget event (`emit`, not awaited)*: rejected — reintroduces the race condition
  SC-003 explicitly rules out.
- *`instructor-assignment` polls for new accounts periodically*: rejected — unnecessary latency
  and complexity (a cron/interval) for something an awaited synchronous check already solves for
  free at the one moment it matters (account creation).

## 2. Read approach for `Account.role`/`email`/`status`

**Decision**: `instructor-assignment` declares its own domain port, `AccountLookup`
(`findById`/`findByEmail` → `{ accountId, email, role, status } | null`), and implements it
*itself* — `PrismaAccountLookup`, inside `instructor-assignment/infrastructure/persistence/`,
querying the shared `accounts` table directly via the shared Prisma client
(`src/shared/persistence/`). This is a **local** port (declared and implemented by the same
module), not a cross-module one — `auth` is never asked to implement it, unlike
`AccountRoleWriter`. Used for eligibility checks (FR-007/FR-008), resolving "does this email
match an existing account" (FR-010), and populating the audit log's `targetEmail`.

**Rationale**: Constitution II requires the `application/` layer to depend only on abstractions
defined in its own module's `domain/` — a use case calling the Prisma client directly, even for
"just a read," would violate that regardless of which module owns the underlying table. A local
port satisfies that cleanly. What it deliberately *doesn't* need is a **cross-module** port
implemented by `auth`, directly extending 002-staff-skater-directory's validated precedent
(research.md #2 there): reading another module's *display/identity* data from the one shared
`accounts` table is not a cross-module file import (Constitution II's actual restriction) — only
genuinely owned *behavior* (session validity in `auth`) or *writes* to another module's owned
column (`role`, here) require the owning module's own port and implementation.

**Alternatives considered**: A *cross-module* read port implemented by `auth` (e.g., an
`AccountReader` `auth` provides, mirroring how it implements `AccountRoleWriter`) — rejected for
the same reason 002 rejected an equivalent for its own display fields: it doesn't change what's
technically enforced (both approaches read the same shared table), just adds indirection and an
unnecessary second cross-module dependency for something a local port already handles cleanly.

## 3. "Already instructor" / "already administrador": no-op response shape, not an HTTP error

**Decision**: `PromoteExistingUserToInstructor` and `AssignInstructorByEmail` return
`{ status: "no_op", reason: "already_instructor" | "already_administrador" }` (HTTP 200) for
FR-007/FR-008, distinct from `{ status: "ok" }` for an actual promotion — never a 4xx.

**Rationale**: spec.md is explicit and consistent across both FRs and User Story 1's Acceptance
Scenario 3: the system "no realiza el cambio e informa" — informing, not erroring. Modeling this
as a 409-style conflict would contradict the spec's own framing and would need the frontend to
treat an "error" response as a normal, expected, non-alarming outcome — more awkward than just
giving it its own success-shaped outcome value.

**Alternatives considered**: `409 Conflict` with an error body — rejected as contradicting
spec.md's explicit "not an error" framing; would also collide with the codebase's existing
convention (established in 001/002) that 4xx bodies represent actual failures the frontend
surfaces as errors, not informational no-ops.

## 4. Access control: `administrador`-only, not staff-wide

**Decision**: A new `AdminOnlySessionGuard`, checking `session.role === 'administrador'`
specifically (rejecting both `skater` and `instructor`) — declared and owned by
`instructor-assignment`, using the same `CurrentSessionResolver` port shape 002 and 004 already
established (a third independently-declared instance, implemented by `auth`).

**Rationale**: FR-006 is explicit: only `administrador` may grant the instructor role —
`instructor` accounts (also "staff" per Constitution VII) are explicitly excluded from this one
capability, unlike 002's listing/profile access, which is staff-wide. Reusing the exact
`CurrentSessionResolver` port pattern (rather than inventing a new session-check mechanism) keeps
this consistent with the two prior instances instead of introducing a fourth way to answer "who's
logged in."

**Alternatives considered**: Extending 002's existing `StaffSessionGuard` with a stricter mode —
rejected: that guard is owned by `skater-directory`, a different module; reaching into it would
be a direct cross-module file import, not reuse through a port.

## 5. Email matching/uniqueness normalization

**Decision**: Invitation-email lookups (duplicate-pending check, FR-009; existing-account match,
FR-010) normalize the input email the same way `auth`'s `PrismaAccountRepository` already does
(`trim().toLowerCase()`) before comparing/storing.

**Rationale**: Consistency — without this, `Admin@Example.com` and `admin@example.com` could be
treated as different emails by this feature while `auth` treats them as the same account,
producing exactly the kind of duplicate-invite or missed-match bug FR-009/FR-010 exist to
prevent.

**Alternatives considered**: Case-sensitive matching — rejected: would silently diverge from
`auth`'s own established uniqueness rule for the very same field.
