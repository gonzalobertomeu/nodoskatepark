# Phase 0 Research: Listado de Staff

All items below were left open by the Technical Context (which fixes runtime, frameworks, and
general architecture via 001/002/003/004's precedent, but not this feature's own design choices).
Each is resolved here so Phase 1 design has no outstanding unknowns.

## 1. A standalone `staff-directory` module, not folded into `instructor-assignment`

**Decision**: A new, independent NestJS module — `apps/backend/src/modules/staff-directory/` —
owning exactly one read use case (`ListStaff`). It does not touch `instructor-assignment` at all.

**Rationale**: The monorepo already has a precedent for splitting a *read* concern from a
*write* concern over the same underlying accounts: `skater-directory` (002, read-only listing of
skaters for staff) is a separate module from `skater-profile` (004, the skater's own write path
for the same data) and from `auth` (001, the account's own lifecycle). This feature is the
read-side mirror of that pattern one level up: `staff-directory` reads staff accounts for an
administrador, exactly as `skater-directory` reads skater accounts for staff — while
`instructor-assignment` (003) remains the sole *write* path for the instructor role. Folding this
listing into `instructor-assignment` would mix a read-only, list-everything concern into a module
whose entire existing design (guards, use cases, audit log) is oriented around individual grant
actions, for no reuse benefit — the two modules share no persistence writes and only the same
`administrador`-only access rule, which is cheap to redeclare (see #4) rather than worth coupling
two modules over.

**Alternatives considered**: Adding a `ListStaff` use case + controller route directly inside
`instructor-assignment` — rejected: would blur that module's single responsibility (granting the
instructor role) and contradicts the module-per-bounded-context split Constitution II already
established between the directory/profile/assignment modules for the skater side.

## 2. Read approach for staff accounts: local `StaffDirectoryRepository` port

**Decision**: `staff-directory` declares its own domain port, `StaffDirectoryRepository`
(`search(query) → StaffListEntry[]`), and implements it itself —
`PrismaStaffDirectoryRepository`, inside `staff-directory/infrastructure/persistence/`, querying
the shared `accounts` table directly via the shared Prisma client, scoped to
`role IN ('instructor', 'administrador')`. This is a **local** port, not a cross-module one —
`auth` is never asked to implement it.

**Rationale**: Directly extends 002's and 003's validated, twice-repeated precedent
(002 research.md, 003 research.md #2): reading another module's *display/identity* data from the
one shared `accounts` table is not a cross-module file import (Constitution II's actual
restriction) — it only requires *some* port, declared and implemented by the reading module
itself, to keep the `application/` layer depending on an abstraction rather than the Prisma
client directly.

**Alternatives considered**: A cross-module `AccountReader` port implemented by `auth` — rejected
for the same reason both prior features rejected the equivalent: it doesn't change what's
technically enforced (both approaches read the same shared table), just adds an unnecessary
second cross-module dependency for something a local port already handles cleanly.

## 3. No pagination — a single, unpaginated response

**Decision**: `GET /staff-directory` returns `{ items: StaffListEntry[] }` — every matching staff
account in one response, no `page`/`pageSize`/`total` fields, unlike 002's `GET /skater-directory`.

**Rationale**: 002's pagination exists because a skatepark's skater population can run into the
hundreds. Staff (`instructor` + `administrador` combined) is, by definition, a small subset of
that same population — spec.md's Scale/Scope frames it as "tens of staff accounts at most."
Reproducing 002's paginated shape for a dataset an order of magnitude smaller adds request
params, response fields, and frontend paging UI that no acceptance scenario or success criterion
calls for; SC-001's 15-second find-a-person budget is trivially met by a single unpaginated list
at this scale.

**Alternatives considered**: Reusing 002's exact paginated contract shape for consistency —
rejected: consistency with a shape designed for a materially larger dataset isn't worth the
unused complexity here; if staff headcount ever grows enough to need paging, that's a future,
explicit scope change to this contract, not a default to pre-build now.

## 4. Access control: a fourth `CurrentSessionResolver` instance, `administrador`-only

**Decision**: A new guard (`StaffDirectoryAdminOnlyGuard`), checking `session.role ===
'administrador'` specifically (rejecting both `skater` and `instructor`) — declared and owned by
`staff-directory`, using the same `CurrentSessionResolver` port shape 002/004/003 already
established (a fourth independently-declared instance, implemented by `auth`).

**Rationale**: FR-007 is explicit and identical in spirit to 003's own FR-006: only
`administrador` may view this listing — `instructor` accounts (also "staff" per Constitution VII)
are excluded, mirroring 003's own precedent of a stricter-than-staff-wide gate (research.md #4
there) rather than reusing 002's staff-wide `StaffSessionGuard`. Reusing the exact
`CurrentSessionResolver` port pattern (rather than inventing a new session-check mechanism, or
reaching into `instructor-assignment`'s own `AdminOnlySessionGuard`) keeps this consistent with
the three prior instances and respects Constitution II's no-direct-cross-module-file-import rule
— `instructor-assignment`'s guard is a different module's `infrastructure/` file.

**Alternatives considered**: Importing/reusing `instructor-assignment`'s `AdminOnlySessionGuard`
directly — rejected: a direct cross-module file import, exactly what Constitution II forbids,
regardless of the two guards' logic being identical. Duplicating a few lines of guard logic
behind each module's own port is the accepted cost of the module-boundary rule, same as it was
for `CurrentSessionResolver` itself across 002/003/004.

## 5. Search matching: case-insensitive partial match across nombre/apellido/email

**Decision**: `StaffDirectoryRepository.search(q)` matches `q` as a case-insensitive substring
against `nombre`, `apellido`, or `email` (FR-006), scoped to `role IN ('instructor',
'administrador')`, ordered by `nombre`/`apellido` ascending.

**Rationale**: Mirrors 002's own `PrismaSkaterDirectoryRepository.search` exactly (Prisma
`contains` + `mode: 'insensitive'`, combined with `OR`) — the only difference is the field set
(`email` instead of `apodo`, since staff accounts have no `apodo` field and FR-006 explicitly
names email as a valid search field for this feature, unlike 002's skater search).

**Alternatives considered**: A dedicated full-text search index — rejected as unnecessary
over-engineering at the "tens of staff accounts" scale this feature targets (see #3).
