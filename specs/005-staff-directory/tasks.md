---

description: "Task list for 005-staff-directory implementation"
---

# Tasks: Listado de Staff

**Input**: Design documents from `/specs/005-staff-directory/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/staff-directory-endpoints.md, quickstart.md

**Tests**: Not explicitly requested in spec.md or by the user for this feature — no dedicated test tasks are included below, consistent with 001/002/003/004's precedent. `bun test` remains the fixed runner for whenever tests are added.

**Organization**: Tasks are grouped by user story (from spec.md, in priority order). This feature extends the existing monorepo (001) and adds one new, standalone read-only module — no changes to any prior module's own logic besides a small `auth` bridge adapter.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths are exact and repo-relative

---

## Phase 1: Setup

**Purpose**: Scaffold the new module shell — nothing below exists on disk yet for this feature. No schema changes, no new dependencies (unlike 003, this feature needs no new package).

- [X] T001 Scaffold the `staff-directory` module shell (`staff-directory.module.ts` + empty `domain/`, `application/`, `infrastructure/` dirs) in `apps/backend/src/modules/staff-directory/`, registered in `apps/backend/src/app.module.ts`

**Checkpoint**: Module shell registered, nothing implemented yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The two ports (one cross-module, one local), the domain entity, persistence, contracts, and frontend client that both user stories build on.

**⚠️ CRITICAL**: No user story task can begin until this phase is complete.

- [X] T002 [P] Define the `CurrentSessionResolver` port (`resolve(request): { accountId, role } | null`) in `apps/backend/src/modules/staff-directory/domain/ports/` (Constitution II cross-module port — a fourth independently-declared instance of the same shape 002/003/004 already introduced)
- [X] T003 [P] Define the `StaffDirectoryRepository` port (`search(q?: string) → StaffListEntry[]`) in `apps/backend/src/modules/staff-directory/domain/ports/` (local — `staff-directory` implements it itself, research.md #2)
- [X] T004 [P] Create the `StaffListEntry` domain entity type (`accountId`, `nombre`, `apellido`, `email`, `role`, `status`) in `apps/backend/src/modules/staff-directory/domain/entities/`
- [X] T005 Implement the `CurrentSessionResolver` adapter (fourth instance), wrapping `auth`'s existing session machinery, in `apps/backend/src/modules/auth/infrastructure/staff-directory-bridge/`, registered against the port and exported from `apps/backend/src/modules/auth/auth.module.ts`
- [X] T006 [P] Implement the Prisma-backed `StaffDirectoryRepository` (reads `Account` scoped to `role IN ('instructor', 'administrador')`, case-insensitive `q` match across `nombre`/`apellido`/`email` — research.md #2, #5) in `apps/backend/src/modules/staff-directory/infrastructure/persistence/`
- [X] T007 [P] Define the `staff-directory` contracts (list request/response + errors + Zod schemas, per `contracts/staff-directory-endpoints.md`) in `packages/contracts/src/staff-directory/list.contract.ts`
- [X] T008 [P] Implement the frontend `staff-directory-client.ts` typed against the contracts in `apps/frontend/src/services/staff-directory-client.ts`

**Checkpoint**: Foundation ready — both user stories can now proceed.

---

## Phase 3: User Story 1 - Ver el listado completo de staff (Priority: P1) 🎯 MVP

**Goal**: An administrador opens the feature and sees every account with role instructor or administrador — nombre, apellido, email, and rol — including accounts with an incomplete profile or a deactivated status.

**Independent Test**: Log in as `administrador`, call `GET /staff-directory` with no query params — verify the response includes every seeded `instructor`/`administrador` account (with "perfil incompleto" for any missing nombre/apellido, and deactivated accounts still present) and no `skater` account.

- [X] T009 [P] [US1] Implement the `ListStaff` use case (no filter — returns every `instructor`/`administrador` account via `StaffDirectoryRepository` — FR-001, FR-002, FR-003, FR-005) in `apps/backend/src/modules/staff-directory/application/use-cases/`
- [X] T010 [US1] Implement the `StaffDirectoryAdminOnlyGuard` (`role === "administrador"` only, rejecting `instructor` too — research.md #4, FR-007) in `apps/backend/src/modules/staff-directory/infrastructure/http/`
- [X] T011 [US1] Implement the `GET /staff-directory` controller (no query param yet — added in User Story 2) in `apps/backend/src/modules/staff-directory/infrastructure/http/staff-directory.controller.ts`
- [X] T012 [P] [US1] Build the `StaffListView` React island (list only for now — search box added in User Story 2; "perfil incompleto" placeholder for missing nombre/apellido, a deactivated badge — FR-002, FR-004, FR-005) in `apps/frontend/src/components/StaffListView.tsx`
- [X] T013 [US1] Create the `/staff` Astro page embedding `StaffListView` in `apps/frontend/src/pages/staff.astro`

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Buscar un miembro de staff específico (Priority: P2)

**Goal**: Within the listing, an administrador narrows results by typing a name or email instead of scanning the whole list.

**Independent Test**: Call `GET /staff-directory?q=<term>` — verify the response includes only staff accounts whose nombre, apellido, or email match `<term>` (case-insensitively), and that a non-matching term returns an empty `items` array.

- [X] T014 [US2] Extend the `ListStaff` use case to accept an optional `q` filter, threading it to `StaffDirectoryRepository.search(q)` (FR-006) in `apps/backend/src/modules/staff-directory/application/use-cases/list-staff.use-case.ts`
- [X] T015 [US2] Extend the `GET /staff-directory` controller to accept `@Query('q')` and pass it through to the use case (FR-006) in `apps/backend/src/modules/staff-directory/infrastructure/http/staff-directory.controller.ts`
- [X] T016 [P] [US2] Add the search input and an empty-state message (no matches) to `StaffListView.tsx`, embedded in the existing `/staff` page from T013

**Checkpoint**: Both user stories are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Consistency and quality gates that span both user stories.

- [X] T017 Run and validate all 6 `quickstart.md` scenarios end-to-end, checking off its Success Criteria checklist (SC-001–SC-004)
- [X] T018 [P] Verify Biome lint/format passes across `apps/backend`, `apps/frontend`, and `packages/contracts` (Constitution V gate) — clean for this feature's files; 4 pre-existing warnings in unrelated auth files left as-is

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS both user stories.
- **User Stories (Phase 3–4)**: Both depend on Foundational completion. US2 (P2) extends the same `ListStaff` use case, controller, and `StaffListView.tsx` files US1 (P1) creates (T009/T011/T012 → T014/T015/T016), so within a solo-developer session finish US1 before starting US2 despite neither task list formally blocking the other.
- **Polish (Phase 5)**: Depends on both user stories being complete (T017 needs both stories done to run the full quickstart).

### Within Each User Story

- Ports + persistence + contracts (Foundational) before any story-specific use case.
- Use case before the controller that wires it up.
- Backend controller before the frontend component/page that calls it.

### Parallel Opportunities

- Foundational tasks marked `[P]` (T002–T004, T006–T008) can run in parallel once their own listed dependencies are satisfied; T005 depends on T002.
- Once Foundational is complete, US1 (Phase 3) must land before US2 (Phase 4) begins, given the shared-file overlap noted above — unlike 003's US1/US2, these aren't independently parallelizable by a solo developer.

---

## Parallel Example: Foundational Phase

```
Task: "Define CurrentSessionResolver port in apps/backend/src/modules/staff-directory/domain/ports/"
Task: "Define StaffDirectoryRepository port in apps/backend/src/modules/staff-directory/domain/ports/"
Task: "Create StaffListEntry domain entity in apps/backend/src/modules/staff-directory/domain/entities/"
Task: "Define staff-directory contracts in packages/contracts/src/staff-directory/list.contract.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocking prerequisite for everything else).
3. Complete Phase 3: User Story 1.
4. **STOP and validate**: Log in as administrador, view the full staff listing, confirm no skater ever appears, confirm incomplete-profile and deactivated accounts render correctly.
5. Deploy/demo if ready.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Add US1 (full listing) → validate independently → MVP.
3. Add US2 (search) → validate independently → run the full `quickstart.md` (all 6 scenarios).

### Parallel Team Strategy

With multiple developers, Foundational's `[P]` tasks can be split across people; US1 and US2 are not independently parallelizable for this feature (see Dependencies above) since US2 extends US1's own files rather than adding new ones.
