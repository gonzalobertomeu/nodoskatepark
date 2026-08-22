---

description: "Task list for 002-staff-skater-directory implementation"
---

# Tasks: Listado y Perfil de Skaters para Staff

**Input**: Design documents from `/specs/002-staff-skater-directory/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/skater-directory-endpoints.md, quickstart.md

**Tests**: Not explicitly requested in spec.md or by the user for this feature — no dedicated test tasks are included below, consistent with 001/004's precedent. `bun test` remains the fixed runner for whenever tests are added.

**Organization**: Tasks are grouped by user story (from spec.md, in priority order). This feature extends the existing monorepo (001) and reads `nombre`/`apellido`/`fechaDeNacimiento` (owned by 004's `skater-profile` module) directly via the shared Prisma client, not a port (research.md #2) — no Setup phase for monorepo/tooling bootstrap is needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact and repo-relative

---

## Phase 1: Setup

**Purpose**: Extend the schema and scaffold the new module shell — nothing below exists on disk yet for this feature.

- [X] T001 Add `apodo` (String?), `afeccionesDeSalud` (String?), `fotoPath` (String?) to the `Account` model, and a new `SkaterHealthAuditLog` model (`skaterAccountId`, `editedByAccountId`, `editedAt`), in `apps/backend/prisma/schema.prisma` (data-model.md)
- [X] T002 Run the Prisma migration for the new columns/table
- [X] T003 [P] Scaffold the `skater-directory` module shell (`skater-directory.module.ts` + empty `domain/`, `application/`, `infrastructure/` dirs) in `apps/backend/src/modules/skater-directory/`, registered in `apps/backend/src/app.module.ts`

**Checkpoint**: Schema extended, module shell registered.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The two real cross-module ports, domain types, persistence (reading the shared display row directly — research.md #2), storage, contracts, and frontend client that all three user stories build on.

**⚠️ CRITICAL**: No user story task can begin until this phase is complete.

- [X] T004 [P] Define the `CurrentSessionResolver` port (`resolve(request): { accountId, role } | null`) in `apps/backend/src/modules/skater-directory/domain/ports/` (Constitution II cross-module port — a second, independently-declared instance of the same shape 004 already introduced for `skater-profile`)
- [X] T005 [P] Define the `LastCheckInReader` port (`lastCheckInAt` by accountId) in `apps/backend/src/modules/skater-directory/domain/ports/` — no real implementer yet (research.md #2)
- [X] T006 Implement the `CurrentSessionResolver` adapter, wrapping `auth`'s existing session machinery, in `apps/backend/src/modules/auth/infrastructure/skater-directory-bridge/`, registered against the port and exported from `apps/backend/src/modules/auth/auth.module.ts`
- [X] T007 [P] Create the `SkaterListEntry` and `SkaterFullProfile` domain entity types (including `nombre`/`apellido`/`fechaDeNacimiento`/`email`/`status` as read-only display fields) in `apps/backend/src/modules/skater-directory/domain/entities/`
- [X] T008 [P] Define the `SkaterDirectoryRepository` port — search/paginate returning the full display row (own `apodo`/`afeccionesDeSalud`/`fotoPath` plus `nombre`/`apellido`/`fechaDeNacimiento`/`email`/`status` read directly, not via a port — research.md #2) and write `apodo`/`afeccionesDeSalud`/`fotoPath` by accountId — in `apps/backend/src/modules/skater-directory/domain/ports/`
- [X] T009 [P] Define the `HealthAuditRepository` port (append a `SkaterHealthAuditLog` row) in `apps/backend/src/modules/skater-directory/domain/ports/`
- [X] T010 [P] Define the `PhotoStorage` port (validate + save/read/replace a photo file by accountId) in `apps/backend/src/modules/skater-directory/domain/ports/`
- [X] T011 Implement the Prisma-backed `SkaterDirectoryRepository` (search/pagination query reading the full shared `accounts` row directly, plus read/write of its own 3 new columns) in `apps/backend/src/modules/skater-directory/infrastructure/persistence/`
- [X] T012 [P] Implement the Prisma-backed `HealthAuditRepository` in `apps/backend/src/modules/skater-directory/infrastructure/persistence/`
- [X] T013 [P] Implement the local-disk `PhotoStorage` adapter (type/size validation per FR-013, reads/writes under the new photo volume path) in `apps/backend/src/modules/skater-directory/infrastructure/storage/`
- [X] T014 [P] Implement the `LastCheckInReader` stub adapter (always resolves `null` — research.md #2) in `apps/backend/src/modules/skater-directory/infrastructure/check-in-stub/`
- [X] T015 [P] Add a named `skater_photos` volume to `apps/backend/compose.yaml`, mounted into the backend container at the path `PhotoStorage` reads/writes (research.md #1)
- [X] T016 [P] Define the `skater-directory` contracts (list/profile/update/photo request/response/errors + Zod schemas, per `contracts/skater-directory-endpoints.md`) in `packages/contracts/src/skater-directory/list-and-profile.contract.ts`
- [X] T017 [P] Implement the frontend `skater-directory-client.ts` typed against the contracts in `apps/frontend/src/services/skater-directory-client.ts`

**Checkpoint**: Foundation ready — all three user stories can now proceed.

---

## Phase 3: User Story 1 - Ver el listado de skaters (Priority: P1) 🎯 MVP

**Goal**: Staff can see a searchable listing of all skaters (nombre, apellido, apodo, foto or placeholder), with skater-role access blocked.

**Independent Test**: Log in as staff, call `GET /skater-directory` (optionally with `q`) — verify every skater appears with the minimum fields (placeholders where data is missing) and that a skater-role session gets `403 forbidden`.

- [X] T018 [P] [US1] Implement the `ListSkaters` use case (search/pagination via `SkaterDirectoryRepository` — FR-001, FR-002, FR-003) in `apps/backend/src/modules/skater-directory/application/use-cases/`
- [X] T019 [US1] Implement the `GET /skater-directory` controller (staff-only via `CurrentSessionResolver` — FR-012) in `apps/backend/src/modules/skater-directory/infrastructure/http/skater-directory.controller.ts`
- [X] T020 [P] [US1] Build the `SkaterListView` React island (search box + list, "perfil incompleto"/no-photo placeholders — FR-002, FR-015) in `apps/frontend/src/components/SkaterListView.tsx`
- [X] T021 [US1] Create the `/skaters` Astro page embedding `SkaterListView` in `apps/frontend/src/pages/skaters/index.astro`

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Ver el perfil completo de un skater (Priority: P1)

**Goal**: Staff can open any skater's full profile — nombre, apellido, apodo, edad, email, último ingreso, afecciones de salud, foto — with explicit placeholders for anything missing.

**Independent Test**: Call `GET /skater-directory/:accountId` for a skater with everything filled in, and separately for one missing photo/afecciones/ingresos — verify all fields render correctly, including explicit empty-state text rather than blanks or errors.

- [X] T022 [P] [US2] Implement the `GetSkaterProfile` use case (`SkaterDirectoryRepository` for the full display row + `LastCheckInReader` — FR-005 through FR-008, FR-015) in `apps/backend/src/modules/skater-directory/application/use-cases/`
- [X] T023 [US2] Implement the `GET /skater-directory/:accountId` controller in `apps/backend/src/modules/skater-directory/infrastructure/http/skater-directory.controller.ts`
- [X] T024 [P] [US2] Build the `SkaterProfileView` React island (all profile fields, explicit placeholders for missing photo/afecciones/ingresos/incomplete-profile fields) in `apps/frontend/src/components/SkaterProfileView.tsx`
- [X] T025 [US2] Create the `/skaters/profile` Astro page (query-param `?accountId=`, not a path param — Astro's output is `static`/no SSR, so a `[accountId].astro` route would need every id known via `getStaticPaths()` at build time, impossible for runtime data; mirrors the existing verify-email/reset-password pattern) embedding `SkaterProfileView` in `apps/frontend/src/pages/skaters/profile.astro`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Editar los datos habilitados del skater (Priority: P2)

**Goal**: Staff can edit apodo, foto, and afecciones de salud from a skater's profile; every other field stays structurally read-only, even via direct API access.

**Independent Test**: Edit apodo/afecciones via `PUT /skater-directory/:accountId` and upload a photo via `POST /skater-directory/:accountId/photo` — verify both persist and are reflected immediately in the profile and listing; verify the `PUT` contract has no field for nombre/apellido/email/etc., and that an invalid photo upload is rejected without touching the existing photo.

- [X] T026 [P] [US3] Implement the `UpdateSkaterEditableFields` use case (`apodo`/`afeccionesDeSalud`; appends a `SkaterHealthAuditLog` row via `HealthAuditRepository` on every health-conditions write — FR-009, FR-011, FR-014) in `apps/backend/src/modules/skater-directory/application/use-cases/`
- [X] T027 [P] [US3] Implement the `UploadSkaterPhoto` use case (validates type/size via `PhotoStorage`, updates `fotoPath`, leaves the previous photo untouched on rejection — FR-013) in `apps/backend/src/modules/skater-directory/application/use-cases/`
- [X] T028 [US3] Implement the `PUT /skater-directory/:accountId`, `POST /skater-directory/:accountId/photo`, and `GET /skater-directory/:accountId/photo` controllers in `apps/backend/src/modules/skater-directory/infrastructure/http/skater-directory.controller.ts`
- [X] T029 [P] [US3] Build the `SkaterEditForm` React island (apodo, photo upload, afecciones de salud only — no field for any other data, per FR-010) in `apps/frontend/src/components/SkaterEditForm.tsx`
- [X] T030 [US3] Embed `SkaterEditForm` into `/skaters/profile`, reflecting a successful save in the profile view immediately without a manual reload (SC-003)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consistency and quality gates that span all three user stories.

- [X] T031 [P] Verify the `/skaters` listing reflects an apodo/foto edit made from the profile page without requiring a manual reload when navigating back (FR-011)
- [X] T032 [P] Add structured logging for `skater-directory` writes (mirrors `auth`'s and `skater-profile`'s `*-logger.service.ts` pattern) in `apps/backend/src/modules/skater-directory/infrastructure/http/`
- [X] T033 Run and validate all 7 `quickstart.md` scenarios end-to-end, checking off its Success Criteria checklist (SC-001–SC-005)
- [X] T034 [P] Verify Biome lint/format passes across `apps/backend`, `apps/frontend`, and `packages/contracts` (Constitution V gate)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all three user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion. US1 and US2 (both P1) can proceed in parallel with each other; US3 (P2) can start in parallel too, though its controller (T028) shares a file with T019/T023, so within a solo-developer session it's simplest to finish each story's controller task before starting the next story's.
- **Polish (Phase 6)**: Depends on the user stories it touches being complete (T033 needs all three stories done to run the full quickstart).

### Within Each User Story

- Cross-module ports + persistence + storage (Foundational) before any story-specific use case.
- Use case before the controller that wires it up.
- Backend controller before the frontend component/page that calls it.
- Frontend component before the Astro page that embeds it.

### Parallel Opportunities

- Foundational tasks marked `[P]` (T004, T005, T007–T010, T012–T017) can run in parallel once their own listed dependencies are satisfied; T006 depends on T004, T011 depends on T007/T008.
- Once Foundational is complete, Phases 3, 4, and 5 can be staffed and run in parallel by different people, with the shared-controller-file caveat above.

---

## Parallel Example: Foundational Phase

```bash
# These have no dependencies on each other:
Task: "Define the CurrentSessionResolver port in apps/backend/src/modules/skater-directory/domain/ports/"
Task: "Define the LastCheckInReader port in apps/backend/src/modules/skater-directory/domain/ports/"
Task: "Create the SkaterListEntry and SkaterFullProfile domain entity types"
Task: "Define the SkaterDirectoryRepository port"
Task: "Add a named skater_photos volume to apps/backend/compose.yaml"
Task: "Define the skater-directory contracts in packages/contracts/src/skater-directory/list-and-profile.contract.ts"
```

## Parallel Example: User Stories 1 & 2

```bash
# Once Foundational is complete, these can be staffed independently:
Task: "Build GET /skater-directory + SkaterListView + /skaters page (US1)"
Task: "Build GET /skater-directory/:accountId + SkaterProfileView + /skaters/profile page (US2)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocks everything else).
3. Complete Phase 3: User Story 1 — listing.
4. **STOP and VALIDATE**: run Scenarios 1 and 2 from `quickstart.md` independently.
5. This is a legitimate MVP: staff can already find any skater by name/apodo, even before the full profile or edit capability lands.

### Incremental Delivery

1. Setup + Foundational → shared aggregation infra ready.
2. Add US1 (listing) → validate independently → MVP.
3. Add US2 (full profile) → validate independently.
4. Add US3 (edit + photo) → validate independently → run the full `quickstart.md` (all 7 scenarios).
5. Phase 6 polish (listing/profile consistency check, logging, lint gate) once all three stories are in.

### Parallel Team Strategy

With multiple developers, after Setup + Foundational are done together:
- Developer A: User Story 1 (listing)
- Developer B: User Story 2 (full profile)
- Developer C: User Story 3 (edit + photo)

All three depend only on the Foundational phase, not on each other's use cases/entities — only their
controller tasks land in the same file, so sequence those relative to each other if working solo.
