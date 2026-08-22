# Implementation Plan: Listado y Perfil de Skaters para Staff

**Branch**: `002-staff-skater-directory` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-staff-skater-directory/spec.md`

## Summary

Staff (instructor/administrador) get a searchable listing of all skaters and a full profile per
skater (nombre, apellido, apodo, edad, email, último ingreso, afecciones de salud, foto), and can
edit exactly three fields (apodo, foto, afecciones de salud) — everything else is read-only, even
via direct API access. Technical approach: a new `skater-directory` NestJS module (module-first
Clean Architecture, per Constitution II) owns the fields this feature adds — `apodo`,
`afeccionesDeSalud`, `fotoPath` as new nullable columns on the existing `Account` table, plus a
dedicated health-condition audit table (FR-014). Its own `SkaterDirectoryRepository` reads the
full display row (including `nombre`/`apellido`/`fechaDeNacimiento` from 004 and `email`/`status`
from 001) directly via the shared Prisma client for the listing and profile *read* paths — a
read-model query across one physical table is not a cross-module file import, so it doesn't need
a port (research.md #2); only `apodo`/`afeccionesDeSalud`/`fotoPath` are ever *written* by this
module. Two real ports remain, for genuinely owned behavior rather than shared-table reads: a
`CurrentSessionResolver` (session validity is `auth`'s stateful, security-critical logic — the
same pattern 004 already established) and a `LastCheckInReader`, which has no real implementation
yet — no check-in feature exists — and is bound to a stub that always returns "no registrado" for
this feature's scope, exactly matching FR-008's required behavior. Photos are stored on local disk
via a named Docker volume (not Postgres, not S3) and served through a staff-gated backend route,
never a public static path.

## Technical Context

**Language/Version**: TypeScript 5.x, running on Bun 1.x (same toolchain as 001/004).

**Primary Dependencies**:
- Backend: NestJS (new `skater-directory` module), Prisma (extends the existing `Account` model;
  one new `SkaterHealthAuditLog` table), Node's built-in `fs` for local-disk photo storage behind
  a `PhotoStorage` port — no new third-party SDK needed for this.
- Frontend: Astro, React 18+ (new listing/profile/edit islands, reusing the neobrutalist
  components already established by 001/004).
- Shared: `packages/contracts/src/skater-directory/` (new contract module), Zod.

**Storage**: PostgreSQL — extends `accounts` with three new nullable columns: `apodo` (string),
`afeccionesDeSalud` (text), `fotoPath` (string — a relative path, not the image itself). A new
`skater_health_audit_log` table (skater account id, editing staff account id, timestamp) backs
FR-014. Photos themselves are **not** stored in Postgres: they're written to a local-disk
directory inside the backend container, backed by a named Docker volume so they survive container
recreation, and served through a staff-gated `GET` route — never a public/static file path (the
whole feature is staff-only, per FR-012, and that must hold for photo bytes too).

**Testing**: `bun test`, consistent with the precedent set by 001/004 (no dedicated test tasks
unless requested).

**Target Platform**: Same Linux containers (Docker Compose) as 001/004 — no new sub-app; the
backend container gains one new named volume for uploaded photos.

**Project Type**: Web application monorepo (unchanged) — a new backend module inside the existing
`apps/backend`, new staff-facing pages/components inside the existing `apps/frontend`, one new
contract module inside the existing `packages/contracts`.

**Performance Goals**: Directory listing/search responds within ~300ms p95 at the scale spec.md's
Assumptions describe (tens to a few thousand accounts). SC-001 (find + open a profile in under 15
seconds) is a human-interaction budget, validated in `quickstart.md`, not a raw-throughput target.

**Constraints**:
- FR-012 (staff-only, no exception for a skater viewing their own entry through this feature)
  MUST be enforced server-side on every endpoint, via a `skater-directory`-owned
  `CurrentSessionResolver` port (Constitution II), implemented by `auth` — mirroring the pattern
  004 already established, not a new pattern.
- `nombre`/`apellido`/`fechaDeNacimiento`/`email`/`status` are read-only here and MUST NOT be
  duplicated/re-entered — `SkaterDirectoryRepository` reads them directly (alongside its own
  `apodo`/`afeccionesDeSalud`/`fotoPath`) via the shared Prisma client for display purposes only;
  it never writes any of them (research.md #2). This is a read-model query against one shared
  table, not a cross-module file import, so Constitution II's port requirement — which governs
  imports of another module's `domain`/`application`/`infrastructure` files — doesn't apply to it.
- FR-010's "not editable, not even via direct API access" MUST be structural: the write
  contract/endpoint must not accept `nombre`/`apellido`/`fechaDeNacimiento`/`email`/`último
  ingreso` as fields at all — not merely hidden in the UI.
- "Último ingreso" is read via a `skater-directory`-owned `LastCheckInReader` port with **no real
  backing feature yet** — bound, for this feature's scope, to a stub implementation that always
  returns "no registrado," which is exactly FR-008's required behavior when nothing has ever been
  recorded. A future check-in feature can rebind this port without touching `skater-directory`.
- Photo upload MUST be validated server-side for type (JPEG/PNG/WebP) and size (≤5MB) — FR-013 —
  independent of whatever the frontend already restricts.
- Health-condition edits MUST be logged (who/when) to `SkaterHealthAuditLog` on every write, per
  FR-014, but that log is never exposed through any read endpoint in this feature's scope
  (confirmed in Clarifications).

**Scale/Scope**: Same skatepark scale as 001/004 (tens to a few thousand accounts). No
multi-tenant, multi-region, or CDN requirement.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Bun-First Runtime & Tooling | New module and frontend pages build/run/test on the existing Bun toolchain; no new runtime. | PASS |
| II. Module-First Clean Architecture Layering | New `skater-directory` module fully self-contained under `apps/backend/src/modules/skater-directory/{domain,application,infrastructure}/`. Two ports for genuinely owned cross-module *behavior*: `CurrentSessionResolver` (implemented+exported by `auth`, same pattern 004 established) and `LastCheckInReader` (no external implementer yet, bound to a local stub). Read-only *display* fields owned by other modules (`nombre`/`apellido`/`fechaDeNacimiento` from `skater-profile`, `email`/`status` from `auth`) are read directly by `skater-directory`'s own `SkaterDirectoryRepository` via the shared Prisma client — a read-model query against one physical table, not an import of another module's files, so no port is needed for it. No module's own `domain/`/`application/`/`infrastructure/` files are imported by another module. `domain/` has zero NestJS/Prisma imports. | PASS |
| III. Contracts as Source of Truth | All new endpoints defined in `packages/contracts/src/skater-directory/` before implementation (Phase 1 output). | PASS |
| IV. Isolated, Containerized Sub-Apps | No new sub-app or Dockerfile — reuses `apps/backend`'s existing container; adds one named volume (photo storage) to its existing `compose.yaml`. | PASS |
| V. Monorepo Tooling Consistency (Nx + Biome) | New module/pages live inside the existing `apps/backend`/`apps/frontend` Nx projects; no new Nx project, same Biome config. | PASS |
| VI. Neobrutalist Design System & Brand Palette | Listing/profile/edit UI reuses the existing neobrutalist tokens/components — no new colors. | PASS |
| VII. Ubiquitous Role Language | Access restricted to `instructor`/`administrador` (staff); `skater` explicitly and structurally excluded (FR-012) — no new role terminology. | PASS |
| VIII. Resend as the Sole Email Delivery Provider | This feature sends no email at all (no notification requirement in spec.md) — the principle isn't implicated. | N/A |

No violations identified. **Complexity Tracking is not needed.**

**Post-Phase 1 re-check**: `data-model.md` keeps the three new columns as a plain extension of the
existing `accounts` table (mirroring 004's precedent) and the new audit table under
`skater-directory/infrastructure/persistence/` — `auth`'s and `skater-profile`'s own domain types
are untouched. The two real cross-module ports introduce no framework/Prisma types into
`skater-directory/domain/`. `contracts/skater-directory-endpoints.md` introduces no endpoint
outside `packages/contracts/src/skater-directory/`'s ownership. All rows above still PASS after
design; no re-evaluation changes.

## Project Structure

### Documentation (this feature)

```text
specs/002-staff-skater-directory/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── skater-directory-endpoints.md
└── tasks.md               # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Extends the existing monorepo skeleton (001) and the `skater-profile` module (004) — no new
sub-app.

```text
apps/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             # extend `Account` (apodo, afeccionesDeSalud, fotoPath);
│   │                                  #   add `SkaterHealthAuditLog`
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   └── infrastructure/
│   │   │   │       └── skater-directory-bridge/  # CurrentSessionResolver adapter, exported
│   │   │   │                                      #   by auth.module.ts
│   │   │   └── skater-directory/                 # NEW module (this feature)
│   │   │       ├── domain/
│   │   │       │   ├── entities/                 # SkaterListEntry, SkaterFullProfile
│   │   │       │   └── ports/                    # SkaterDirectoryRepository,
│   │   │       │                                 #   HealthAuditRepository, PhotoStorage,
│   │   │       │                                 #   CurrentSessionResolver, LastCheckInReader
│   │   │       ├── application/
│   │   │       │   └── use-cases/                 # ListSkaters, GetSkaterProfile,
│   │   │       │                                   #   UpdateSkaterEditableFields,
│   │   │       │                                   #   UploadSkaterPhoto
│   │   │       ├── infrastructure/
│   │   │       │   ├── http/                      # GET /skater-directory,
│   │   │       │   │                               #   GET/PUT /skater-directory/:id,
│   │   │       │   │                               #   POST/GET .../:id/photo
│   │   │       │   ├── persistence/                # Prisma-backed SkaterDirectoryRepository
│   │   │       │   │                                #   (reads the full display row directly —
│   │   │       │   │                                #   research.md #2 — plus HealthAuditRepository)
│   │   │       │   ├── storage/                     # local-disk PhotoStorage adapter
│   │   │       │   └── check-in-stub/                # LastCheckInReader stub (always null)
│   │   │       └── skater-directory.module.ts
│   │   └── shared/                                 # unchanged (config, Prisma client)
│   └── test/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── skaters/
│   │   │   │   ├── index.astro       # NEW — staff listing + search
│   │   │   │   └── profile.astro     # NEW — staff profile view + edit form; reads
│   │   │   │                          #   ?accountId= from the query string, not a path
│   │   │   │                          #   param (static output, no getStaticPaths for
│   │   │   │                          #   runtime ids — same pattern as verify-email)
│   │   ├── components/
│   │   │   ├── SkaterListView.tsx    # NEW — search box + list, "perfil incompleto"/
│   │   │   │                          #   no-photo/no-health/no-checkin placeholders
│   │   │   ├── SkaterProfileView.tsx # NEW — read-only fields + embeds the edit form
│   │   │   └── SkaterEditForm.tsx    # NEW — apodo, foto upload, afecciones de salud only
│   │   └── services/
│   │       └── skater-directory-client.ts  # NEW — typed client, mirrors existing clients
│
packages/
└── contracts/
    └── src/
        └── skater-directory/
            └── list-and-profile.contract.ts  # list/profile/update/photo + Zod schemas
```

**Structure Decision**: Same Nx monorepo (Constitution "Option 2" shape) as 001/004. This feature
adds one new backend module (`skater-directory`, module-first Clean Architecture per Principle
II), two new frontend pages/components, and one new contract module — no new sub-app, Dockerfile,
or Nx project. The only change inside `auth` is a small bridge adapter implementing
`skater-directory`'s `CurrentSessionResolver` port; `skater-profile` isn't touched at all —
`skater-directory` reads its display fields directly via the shared Prisma client instead of a
port (research.md #2).

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
