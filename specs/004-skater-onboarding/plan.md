# Implementation Plan: Onboarding de Datos Básicos del Skater

**Branch**: `004-skater-onboarding` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-skater-onboarding/spec.md`

## Summary

Every skater account with a missing `nombre`, `apellido`, or `fechaDeNacimiento` — whether
brand-new (001's registration only ever collected email/password) or pre-existing from before
this feature — is gated at the MainApp entry point (not at login itself, so it also catches
bookmarked/direct navigation and multi-tab re-entry) into a mandatory, self-service onboarding
form. Once submitted, the skater lands in the MainApp and can later edit the same three fields
from their own profile. Staff accounts (instructor/administrador) are never gated. Technical
approach: a new `skater-profile` NestJS module (module-first Clean Architecture, per Constitution
II) owns this data — three new nullable columns added to the existing `Account` table (per
001-user-login-sso's own data-model.md, which already reserved this extension point), read and
written exclusively by `skater-profile`'s persistence layer. Cross-module session lookup goes
through a port `skater-profile` declares in its own `domain/`, implemented and exported by the
`auth` module — no direct import of `auth`'s internals. The Astro frontend (still `output:
"static"`, no SSR) gates client-side at `/` (MainApp), mirroring the pattern already established
for 001's FR-018.

## Technical Context

**Language/Version**: TypeScript 5.x, running on Bun 1.x (same toolchain as 001-user-login-sso).

**Primary Dependencies**:
- Backend: NestJS (new `skater-profile` module), Prisma (extends the existing `Account` model —
  no new table).
- Frontend: Astro, React 18+ (new `OnboardingForm`/`BasicInfoForm` islands, reusing the
  neobrutalist component styles already established by 001).
- Shared: `packages/contracts/src/skater-profile/` (new contract module), Zod — same pattern as
  `packages/contracts/src/auth/`.

**Storage**: PostgreSQL — same `accounts` table, extended with three new nullable columns
(`nombre`, `apellido`, `fechaDeNacimiento`). No new table: 001's `data-model.md` already
documented this exact extension point ("belong to ... 'Perfil de skater', which extends this same
Account row but is owned by that feature"). The `auth` module's own domain `Account` type is
unchanged and never references these three columns; only `skater-profile`'s persistence layer
reads/writes them.

**Testing**: `bun test`, consistent with Constitution Principle I and the precedent set by
001-user-login-sso (no dedicated test tasks unless requested; `bun test` remains the fixed runner
for whenever tests are added).

**Target Platform**: Same Linux containers (Docker Compose) and evergreen browsers as
001-user-login-sso — no new sub-app, no new container.

**Project Type**: Web application monorepo (unchanged) — a new backend module inside the existing
`apps/backend`, new pages/components inside the existing `apps/frontend`.

**Performance Goals**: Same order of magnitude as 001 — `skater-profile` endpoints respond within
~300ms p95 under normal load; SC-001/SC-004 are end-to-end UX timings validated in
`quickstart.md`, not load-tested.

**Constraints**:
- `fechaDeNacimiento` MUST be validated (client + server) as not in the future and within a
  realistic age range before being accepted (FR-005); no minimum-age/consent policy is enforced
  (per spec.md's Assumptions — out of scope).
- `PUT /skater-profile/me` requires all three fields together on every call (no partial-field
  updates) — the same operation serves both the initial onboarding submission (FR-004) and later
  self-edits (FR-006), and requiring all three atomically is what naturally satisfies FR-009 (no
  partial data persisted if the skater abandons the form).
- The onboarding gate MUST be enforced at the MainApp entry point (`/`), not only right after
  login, so it also covers direct/bookmarked navigation and a second tab catching up after
  another tab completes onboarding (Edge Cases). Astro's output is `static` (no SSR), so — like
  001's FR-018 — this MUST run as a client-side check, not server-side routing logic.
- Cross-module dependency from `skater-profile` on `auth` (resolving "who is the current
  session") MUST go through a port (`CurrentSessionResolver`) declared in `skater-profile`'s own
  `domain/ports/`, implemented and exported by the `auth` module — no direct import of `auth`'s
  `domain/`, `application/`, or `infrastructure/` files (Constitution II).
- Staff accounts (instructor/administrador) MUST never be gated or shown the onboarding form
  (FR-008) — the frontend guard checks role, not just authentication.

**Scale/Scope**: Same skatepark scale as 001/002 (tens to a few thousand accounts). No
multi-tenant or high-throughput requirements.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Bun-First Runtime & Tooling | New module and frontend pages build/run/test on the same existing Bun toolchain; no new runtime. | PASS |
| II. Module-First Clean Architecture Layering | New `skater-profile` module fully self-contained under `apps/backend/src/modules/skater-profile/{domain,application,infrastructure}/`. Cross-module read of session state goes through a port (`CurrentSessionResolver`) declared in `skater-profile/domain/ports/`, implemented by `auth` and registered/exported via NestJS DI — no direct cross-module import. `domain/` has zero NestJS/Prisma imports. | PASS |
| III. Contracts as Source of Truth | `GET /skater-profile/me` and `PUT /skater-profile/me` defined in `packages/contracts/src/skater-profile/basic-info.contract.ts` before implementation (Phase 1 output); backend implements against it, frontend consumes it via a typed client. | PASS |
| IV. Isolated, Containerized Sub-Apps | No new sub-app or Dockerfile needed — reuses `apps/backend`/`apps/frontend`'s existing containers. | PASS (no change) |
| V. Monorepo Tooling Consistency (Nx + Biome) | New module/pages live inside the existing `apps/backend`/`apps/frontend` Nx projects (same as `auth`); no new Nx project, same Biome config. | PASS |
| VI. Neobrutalist Design System & Brand Palette | `OnboardingForm`/`BasicInfoForm` reuse the existing neobrutalist tokens/components from 001 — no new colors. | PASS |
| VII. Ubiquitous Role Language | Gate applies exclusively to `skater` accounts; `instructor`/`administrador` (staff) are explicitly excluded (FR-008) — no new role terminology introduced. | PASS |

No violations identified. **Complexity Tracking is not needed.**

**Post-Phase 1 re-check**: `data-model.md` keeps the three new columns as a plain extension of
the existing `accounts` table, read/written only by `skater-profile/infrastructure/persistence/`
— the `auth` module's Prisma usage and domain `Account` type are untouched. The
`CurrentSessionResolver` port introduces no framework/Prisma types into `skater-profile/domain/`.
`contracts/skater-profile-endpoints.md` introduces no endpoint outside
`packages/contracts/src/skater-profile/`'s ownership. All rows above still PASS after design; no
re-evaluation changes.

## Project Structure

### Documentation (this feature)

```text
specs/004-skater-onboarding/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── skater-profile-endpoints.md
└── tasks.md               # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Extends the existing monorepo skeleton (bootstrapped by 001-user-login-sso) — no new sub-app.

```text
apps/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             # extend `Account` with nombre/apellido/fechaDeNacimiento
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   └── infrastructure/
│   │   │   │       └── skater-profile-bridge/   # CurrentSessionResolver adapter,
│   │   │   │                                     #   exported by auth.module.ts
│   │   │   └── skater-profile/                  # NEW module (this feature)
│   │   │       ├── domain/
│   │   │       │   ├── entities/                # SkaterBasicInfo (nombre, apellido,
│   │   │       │   │                             #   fechaDeNacimiento, complete)
│   │   │       │   └── ports/                   # SkaterProfileRepository,
│   │   │       │                                 #   CurrentSessionResolver
│   │   │       ├── application/
│   │   │       │   └── use-cases/                # GetMyBasicInfo, SaveMyBasicInfo
│   │   │       │                                  #   (serves onboarding + later edits)
│   │   │       ├── infrastructure/
│   │   │       │   ├── http/                     # GET/PUT /skater-profile/me controller
│   │   │       │   └── persistence/               # Prisma-backed SkaterProfileRepository
│   │   │       │                                   #   (reads/writes the 3 Account columns)
│   │   │       └── skater-profile.module.ts
│   │   └── shared/                                # unchanged (config, Prisma client)
│   └── test/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── onboarding.astro      # NEW — mandatory onboarding form
│   │   │   └── profile.astro         # NEW — self-service edit (User Story 2)
│   │   ├── components/
│   │   │   ├── MainAppPlaceholder.tsx        # EXTEND — already does its own GET /auth/session
│   │   │   │                                 #   check + redirect on `/`; add a second check
│   │   │   │                                 #   (GET /skater-profile/me, skater role only) that
│   │   │   │                                 #   redirects to /onboarding if incomplete, instead
│   │   │   │                                 #   of introducing a separate guard component
│   │   │   └── SkaterBasicInfoForm.tsx       # NEW — shared by onboarding.astro (mode=create)
│   │   │                                      #   and profile.astro (mode=edit)
│   │   └── services/
│   │       └── skater-profile-client.ts     # NEW — typed client, mirrors auth-client.ts
│
packages/
└── contracts/
    └── src/
        └── skater-profile/
            └── basic-info.contract.ts        # GET/PUT /skater-profile/me + Zod schemas
```

**Structure Decision**: Same Nx monorepo (Constitution "Option 2" shape) as 001/002. This feature
adds one new backend module (`skater-profile`, module-first Clean Architecture per Principle II)
inside the existing `apps/backend`, three new frontend pages/components inside the existing
`apps/frontend`, and one new contract module inside the existing `packages/contracts` — no new
sub-app, Dockerfile, or Nx project. The only change inside the existing `auth` module is a small
adapter (`skater-profile-bridge/`) that implements and exports `skater-profile`'s
`CurrentSessionResolver` port; `auth`'s own domain/application logic is untouched.

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
