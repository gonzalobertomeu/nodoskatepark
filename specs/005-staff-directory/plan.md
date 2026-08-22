# Implementation Plan: Listado de Staff

**Branch**: `005-staff-directory` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-staff-directory/spec.md`

## Summary

An administrador views a listing of every account with role `instructor` or `administrador` —
nombre, apellido, email, role, and status — with a search box to narrow it by name or email.
Technical approach: a new, standalone `staff-directory` NestJS module (module-first Clean
Architecture, per Constitution II) that owns exactly one read use case (`ListStaff`) and no
persisted data of its own. It reads `Account` rows scoped to `role IN ('instructor',
'administrador')` through a *local* port (`StaffDirectoryRepository`) it declares and implements
itself, backed by the shared Prisma client — extending 002's and 003's established precedent that
reading another module's display/identity data from the shared `accounts` table is not a
cross-module file import. The only real cross-module dependency is session identity: a fourth
independently-declared `CurrentSessionResolver` port, implemented by `auth`, behind a new
`administrador`-only guard (FR-007 is stricter than 002's staff-wide access, mirroring 003's own
`AdminOnlySessionGuard`). No new table, no new column, no write path, no pagination (staff is a
much smaller dataset than 002's skater listing).

## Technical Context

**Language/Version**: TypeScript 5.x, running on Bun 1.x (same toolchain as 001/002/003/004).

**Primary Dependencies**:
- Backend: NestJS (new `staff-directory` module), Prisma (reads only — no new tables/columns).
- Frontend: Astro, React 18+ (new admin-only page + list component).
- Shared: `packages/contracts/src/staff-directory/` (new contract module), Zod.

**Storage**: PostgreSQL — no schema changes. This feature only ever reads the existing `Account`
table's `nombre`/`apellido`/`email`/`role`/`status` columns, scoped to
`role IN ('instructor', 'administrador')`, via the local `StaffDirectoryRepository` port.

**Testing**: `bun test`, consistent with the precedent set by 001/002/003/004 (no dedicated test
tasks unless requested).

**Target Platform**: Same Linux containers (Docker Compose) as 001/002/003/004 — no new sub-app,
no new volume.

**Project Type**: Web application monorepo (unchanged) — a new backend module inside the
existing `apps/backend`, one new admin-only page inside the existing `apps/frontend`, one new
contract module inside the existing `packages/contracts`.

**Performance Goals**: Same order of magnitude as 001/002/003/004 — the endpoint responds within
~300ms p95 at the documented scale. SC-001 (find a person in under 15s) is a human-interaction
budget, validated in `quickstart.md`, not a raw-throughput target.

**Constraints**:
- FR-007 restricts this feature to `administrador` sessions specifically — the same stricter-
  than-staff gate 003 already established, via a new, independently-declared
  `CurrentSessionResolver` instance (the fourth) and a new `StaffDirectoryAdminOnlyGuard` owned
  by this module (research.md #4) — not a direct reuse of `instructor-assignment`'s own guard,
  which would be a forbidden cross-module file import.
- No pagination: the response returns every match in one payload, unlike 002's paginated
  `GET /skater-directory` — justified by the much smaller expected scale of staff vs. skaters
  (research.md #3).
- Read-only: no use case, controller route, or UI action in this feature ever writes to
  `Account` or any other table (FR-008) — role/status/profile changes remain the exclusive
  responsibility of other features (003, and others not yet built).
- No structured audit logging for this feature's own listing reads — mirrors 002's identical
  precedent of logging only its *writes*, never its `GET` listing endpoint.
- Pending `InstructorInvitation` rows (003) are structurally excluded — the repository only ever
  queries `Account`, which has no row for a pending invitation (FR-009).

**Scale/Scope**: Same skatepark scale as 001/002/003/004, but for the `instructor`/
`administrador` subset specifically — tens of staff accounts at most (a small fraction of the
"tens to a few thousand accounts" figure used for the full user base).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Bun-First Runtime & Tooling | New module and frontend page build/run/test on the existing Bun toolchain; no new runtime. | PASS |
| II. Module-First Clean Architecture Layering | New `staff-directory` module fully self-contained under `apps/backend/src/modules/staff-directory/{domain,application,infrastructure}/`. One cross-module port (`CurrentSessionResolver`, a fourth independently-declared instance), declared by `staff-directory`, implemented+exported by `auth` — a single direction, no circular import. Reads of `Account.nombre`/`apellido`/`email`/`role`/`status` go through a local port (`StaffDirectoryRepository`) `staff-directory` both declares and implements itself via the shared Prisma client, per 002/003's established precedent. `domain/` has zero NestJS/Prisma imports. | PASS |
| III. Contracts as Source of Truth | The new endpoint is defined in `packages/contracts/src/staff-directory/` before implementation (Phase 1 output). | PASS |
| IV. Isolated, Containerized Sub-Apps | No new sub-app, Dockerfile, or volume — reuses `apps/backend`'s and `apps/frontend`'s existing containers. | PASS |
| V. Monorepo Tooling Consistency (Nx + Biome) | New module/page live inside the existing `apps/backend`/`apps/frontend` Nx projects; no new Nx project, same Biome config. | PASS |
| VI. Neobrutalist Design System & Brand Palette | The new admin page reuses the existing neobrutalist tokens/components — no new colors. | PASS |
| VII. Ubiquitous Role Language | Uses `skater`/`instructor`/`administrador`/`staff` exclusively; FR-007 enforces `administrador`-only access, a precise subset of "staff" — no new role terminology. | PASS |
| VIII. Resend as the Sole Email Delivery Provider | This feature sends no email — the principle isn't implicated. | N/A |

No violations identified. **Complexity Tracking is not needed.**

**Post-Phase 1 re-check**: `data-model.md` confirms no new table/column — `staff-directory` only
ever reads `Account` through its own local `StaffDirectoryRepository`, implemented inside
`staff-directory/infrastructure/persistence/`. `contracts/staff-directory-endpoints.md`
introduces no endpoint outside `packages/contracts/src/staff-directory/`'s ownership, and its
single `GET /staff-directory` route requires no request body, only an optional query param. All
rows above still PASS after design; no re-evaluation changes.

## Project Structure

### Documentation (this feature)

```text
specs/005-staff-directory/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── staff-directory-endpoints.md
└── tasks.md               # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Extends the existing monorepo skeleton (001) — no new sub-app, no changes to any prior module.

```text
apps/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   └── infrastructure/
│   │   │   │       └── staff-directory-bridge/  # NEW — fourth CurrentSessionResolver
│   │   │   │                                     #   adapter, exported by auth.module.ts
│   │   │   └── staff-directory/                  # NEW module (this feature)
│   │   │       ├── domain/
│   │   │       │   ├── entities/                  # StaffListEntry
│   │   │       │   └── ports/                      # CurrentSessionResolver (cross-module),
│   │   │       │                                    #   StaffDirectoryRepository (local)
│   │   │       ├── application/
│   │   │       │   └── use-cases/                  # ListStaff
│   │   │       ├── infrastructure/
│   │   │       │   ├── http/                        # StaffDirectoryAdminOnlyGuard,
│   │   │       │   │                                 #   GET /staff-directory controller
│   │   │       │   └── persistence/                  # PrismaStaffDirectoryRepository
│   │   │       └── staff-directory.module.ts
│   │   └── shared/                                    # unchanged — no new shared concept
│   └── test/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── staff.astro           # NEW — admin-only: staff listing + search
│   │   ├── components/
│   │   │   └── StaffListView.tsx      # NEW — search box + list, mirrors SkaterListView's
│   │   │                               #   "perfil incompleto" placeholder pattern
│   │   └── services/
│   │       └── staff-directory-client.ts  # NEW — typed client, mirrors existing clients
│
packages/
└── contracts/
    └── src/
        └── staff-directory/
            └── list.contract.ts  # GET /staff-directory request/response + Zod schemas
```

**Structure Decision**: Same Nx monorepo (Constitution "Option 2" shape) as 001/002/003/004. This
feature adds one new backend module (`staff-directory`, module-first Clean Architecture per
Principle II), one new admin-only frontend page/component, and one new contract module — no new
sub-app, Dockerfile, or Nx project. The only change inside `auth` is a small bridge adapter (a
fourth `CurrentSessionResolver` instance); `auth`'s own domain/application logic and every other
module (`skater-profile`, `skater-directory`, `instructor-assignment`) are untouched.

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
