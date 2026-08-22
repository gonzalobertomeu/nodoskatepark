---

description: "Task list for 004-skater-onboarding implementation"
---

# Tasks: Onboarding de Datos Básicos del Skater

**Input**: Design documents from `/specs/004-skater-onboarding/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/skater-profile-endpoints.md, quickstart.md

**Tests**: Not explicitly requested in spec.md or by the user for this feature — no dedicated test tasks are included below, consistent with 001-user-login-sso's precedent. `bun test` remains the fixed runner for whenever tests are added.

**Organization**: Tasks are grouped by user story (from spec.md, in priority order). This feature extends the existing monorepo bootstrapped by 001-user-login-sso — no Setup phase for monorepo/tooling bootstrap is needed; Phase 1 here covers only this feature's own schema/module scaffolding.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths are exact and repo-relative

---

## Phase 1: Setup

**Purpose**: Extend the existing schema and scaffold the new module shell — nothing below exists on disk yet for this feature.

- [X] T001 Add `nombre` (String?), `apellido` (String?), `fechaDeNacimiento` (DateTime?) to the `Account` model in `apps/backend/prisma/schema.prisma` (data-model.md)
- [X] T002 Run the Prisma migration for the new columns
- [X] T003 [P] Scaffold the `skater-profile` module shell (`skater-profile.module.ts` + empty `domain/`, `application/`, `infrastructure/` dirs) in `apps/backend/src/modules/skater-profile/`, registered in `apps/backend/src/app.module.ts`

**Checkpoint**: Schema extended, module shell registered.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The contract, domain, persistence, cross-module port, and controller that both user stories consume identically — `GET`/`PUT /skater-profile/me` is not story-specific (both the onboarding submission and the later edit are the same operation).

**⚠️ CRITICAL**: No user story task can begin until this phase is complete.

- [X] T004 [P] Define the basic-info contract (`GET`/`PUT /skater-profile/me` request/response/errors + Zod schemas, per `contracts/skater-profile-endpoints.md`) in `packages/contracts/src/skater-profile/basic-info.contract.ts`
- [X] T005 [P] Create the `SkaterBasicInfo` domain type (`nombre`, `apellido`, `fechaDeNacimiento`, derived `complete`) in `apps/backend/src/modules/skater-profile/domain/entities/`
- [X] T006 [P] Define the `SkaterProfileRepository` port (`findByAccountId`, `save`) in `apps/backend/src/modules/skater-profile/domain/ports/`
- [X] T007 [P] Define the `CurrentSessionResolver` port (`resolve(request): { accountId, role } | null`) in `apps/backend/src/modules/skater-profile/domain/ports/` (Constitution II cross-module port — research.md #2)
- [X] T008 Implement the `CurrentSessionResolver` adapter, wrapping `auth`'s existing `ValidateSessionUseCase`, in `apps/backend/src/modules/auth/infrastructure/skater-profile-bridge/`, registered against the port and exported from `apps/backend/src/modules/auth/auth.module.ts`
- [X] T009 Implement the Prisma-backed `SkaterProfileRepository` (reads/writes only the 3 new `Account` columns, via the shared `PrismaService`) in `apps/backend/src/modules/skater-profile/infrastructure/persistence/`
- [X] T010 [P] Implement the `GetMyBasicInfo` use case (computes `complete`) in `apps/backend/src/modules/skater-profile/application/use-cases/`
- [X] T011 [P] Implement the `SaveMyBasicInfo` use case (requires all 3 fields together — FR-009; validates non-empty nombre/apellido and the FR-005 birth-date sanity bound from research.md #4) in `apps/backend/src/modules/skater-profile/application/use-cases/`
- [X] T012 Implement the `GET /skater-profile/me` and `PUT /skater-profile/me` controller (skater-only via role check on the resolved session — FR-008) in `apps/backend/src/modules/skater-profile/infrastructure/http/skater-profile.controller.ts`
- [X] T013 [P] Implement the frontend `skater-profile-client.ts` (`getMyBasicInfo`, `saveMyBasicInfo`) typed against the contract, in `apps/frontend/src/services/skater-profile-client.ts`

**Checkpoint**: Foundation ready — both user stories can now proceed.

---

## Phase 3: User Story 1 - Completar datos obligatorios al ingresar (Priority: P1) 🎯 MVP

**Goal**: A skater with a missing `nombre`/`apellido`/`fechaDeNacimiento` — new or pre-existing — is gated to a mandatory onboarding form at the MainApp entry point, for both credentials and Google logins, and lands in the MainApp only once all three fields are completed.

**Independent Test**: Log in with a skater account that has `nombre`/`apellido`/`fechaDeNacimiento` all `NULL` — verify the app never renders the MainApp placeholder and instead ends up on `/onboarding`; submit valid values and verify `PUT /skater-profile/me` returns `200` and the app then renders the MainApp placeholder.

- [X] T014 [P] [US1] Build the `SkaterBasicInfoForm` React island (neobrutalist styling; nombre/apellido/fecha de nacimiento fields; blocks submit unless all three are filled and valid — FR-003, FR-005) in `apps/frontend/src/components/SkaterBasicInfoForm.tsx`
- [X] T015 [US1] Extend `MainAppPlaceholder`'s existing `GET /auth/session` check: when `authenticated && role === "skater"`, also call `skaterProfileClient.getMyBasicInfo()` and redirect to `/onboarding` instead of rendering the placeholder when `complete === false` (research.md #3 — gate at the MainApp entry point, not at login, so it also covers direct navigation and multi-tab re-entry) in `apps/frontend/src/components/MainAppPlaceholder.tsx`
- [X] T016 [US1] Create the `/onboarding` Astro page embedding `SkaterBasicInfoForm` (mode=create, calls `saveMyBasicInfo` then redirects to `/` on success) in `apps/frontend/src/pages/onboarding.astro`
- [X] T017 [US1] Wire the "missing field" blocking message and the FR-005 invalid-birth-date error message into `SkaterBasicInfoForm`

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Editar mis datos básicos más adelante (Priority: P2)

**Goal**: A skater who already completed onboarding can view and edit their own `nombre`/`apellido`/`fechaDeNacimiento` from a profile page, with the change reflected immediately.

**Independent Test**: Log in with a skater account that already has all 3 fields set — open `/profile`, verify the current values are pre-filled, change one field, save, and verify the new value is reflected on the same page without a manual reload.

- [X] T018 [P] [US2] Create the `/profile` Astro page embedding `SkaterBasicInfoForm` (mode=edit, pre-filled via `skaterProfileClient.getMyBasicInfo()`, saves via `saveMyBasicInfo` and updates on-screen without a reload — SC-004) in `apps/frontend/src/pages/profile.astro`
- [X] T019 [US2] Add a link to `/profile` from `apps/frontend/src/components/MainAppPlaceholder.tsx` (done alongside T015 — same file, same edit)

**Checkpoint**: Both user stories are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Consistency and quality gates that span both user stories.

- [X] T020 [P] Redirect away from `/onboarding` to `/` if the skater's profile is already complete, or if the session is not an authenticated skater (staff exclusion — FR-008) — implemented inside `SkaterBasicInfoForm`'s existing mode="create" data-fetch effect rather than a separate check in `onboarding.astro`, in `apps/frontend/src/components/SkaterBasicInfoForm.tsx`
- [X] T021 [P] Add structured logging for `skater-profile` writes (mirrors `auth`'s `security-logger.service.ts` pattern; distinguishes `basic_info_completed` from `basic_info_updated`) in `apps/backend/src/modules/skater-profile/infrastructure/http/skater-profile-logger.service.ts`
- [X] T022 Run and validate all 9 `quickstart.md` scenarios end-to-end, checking off its Success Criteria checklist (SC-001–SC-004)
- [X] T023 [P] Verify Biome lint/format passes across `apps/backend`, `apps/frontend`, and `packages/contracts` (Constitution V gate)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS both user stories.
- **User Stories (Phase 3–4)**: Both depend on Foundational completion. US1 (P1) and US2 (P2) touch different frontend files (`onboarding.astro` vs. `profile.astro`) and can proceed in parallel, though US2's independent test is more useful once a skater can actually reach a completed state via US1.
- **Polish (Phase 5)**: Depends on the user stories it touches being complete (T022 needs both stories done to run the full quickstart).

### Within Each User Story

- Contract/domain/persistence/controller (Foundational) before any story-specific frontend task.
- `SkaterBasicInfoForm` (T014) before the pages that embed it (T016, T018).
- Frontend client (T013) before any component/page that calls it.

### Parallel Opportunities

- T003 (module scaffold) can run in parallel with T001/T002 (schema/migration) once both are needed by Foundational, though T002 must follow T001.
- Foundational tasks marked `[P]` (T004, T005, T006, T007, T010, T011, T013) can run in parallel once their own listed dependencies are satisfied; T008 depends on T007, T009 depends on T005/T006, T012 depends on T008–T011.
- Once Foundational is complete, Phase 3 and Phase 4 can be staffed and run in parallel.

---

## Parallel Example: Foundational Phase

```bash
# These have no dependencies on each other, once T001-T003 are done:
Task: "Define the basic-info contract in packages/contracts/src/skater-profile/basic-info.contract.ts"
Task: "Create the SkaterBasicInfo domain type in apps/backend/src/modules/skater-profile/domain/entities/"
Task: "Define the SkaterProfileRepository port in apps/backend/src/modules/skater-profile/domain/ports/"
Task: "Define the CurrentSessionResolver port in apps/backend/src/modules/skater-profile/domain/ports/"
Task: "Implement the frontend skater-profile-client.ts in apps/frontend/src/services/skater-profile-client.ts"
```

## Parallel Example: User Stories 1 & 2

```bash
# Once Foundational is complete, these can be staffed independently:
Task: "Build /onboarding + SkaterBasicInfoForm + MainAppPlaceholder gate (US1)"
Task: "Build /profile + edit wiring (US2)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocks everything else).
3. Complete Phase 3: User Story 1 — mandatory onboarding gate.
4. **STOP and VALIDATE**: run Scenarios 1, 2, 3, 4, 5, 6, 8, 9 from `quickstart.md` independently.
5. This is a legitimate MVP: every skater, new or pre-existing, ends up with a complete profile before reaching the MainApp.

### Incremental Delivery

1. Setup + Foundational → shared backend + client ready.
2. Add US1 (mandatory onboarding) → validate independently → MVP.
3. Add US2 (self-edit) → validate independently → run the full `quickstart.md` (all 9 scenarios).
4. Phase 5 polish (onboarding-already-complete guard, logging, lint gate) once both stories are in.

### Parallel Team Strategy

With multiple developers, after Setup + Foundational are done together:
- Developer A: User Story 1 (mandatory onboarding gate)
- Developer B: User Story 2 (self-edit profile page)

Both depend only on the Foundational phase, not on each other, so they can proceed concurrently.
