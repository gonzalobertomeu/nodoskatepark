---

description: "Task list for 003-instructor-role-assignment implementation"
---

# Tasks: Asignación del Rol de Instructor por un Administrador

**Input**: Design documents from `/specs/003-instructor-role-assignment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/instructor-assignment-endpoints.md, quickstart.md

**Tests**: Not explicitly requested in spec.md or by the user for this feature — no dedicated test tasks are included below, consistent with 001/002/004's precedent. `bun test` remains the fixed runner for whenever tests are added.

**Organization**: Tasks are grouped by user story (from spec.md, in priority order). This feature extends the existing monorepo (001), reuses 002's skater listing unmodified (no backend changes to it), and extends two of 001's existing use cases — no Setup phase for monorepo/tooling bootstrap is needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact and repo-relative

---

## Phase 1: Setup

**Purpose**: Extend the schema, add the event-emitter dependency, and scaffold the new module shell — nothing below exists on disk yet for this feature.

- [X] T001 Add `InstructorInvitation` (email, createdByAdminId, status, createdAt, resolvedAccountId, resolvedAt, cancelledAt) and `RoleAssignmentAuditLog` (adminAccountId, targetAccountId, targetEmail, method, createdAt) models to `apps/backend/prisma/schema.prisma` (data-model.md) — no changes to `Account`'s own columns
- [X] T002 Run the Prisma migration for the new tables
- [X] T003 [P] Add `@nestjs/event-emitter` to `apps/backend/package.json`; register `EventEmitterModule.forRoot()` in `apps/backend/src/app.module.ts` (research.md #1)
- [X] T004 [P] Scaffold the `instructor-assignment` module shell (`instructor-assignment.module.ts` + empty `domain/`, `application/`, `infrastructure/` dirs) in `apps/backend/src/modules/instructor-assignment/`, registered in `apps/backend/src/app.module.ts`

**Checkpoint**: Schema extended, event emitter available, module shell registered.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The ports (one local, two cross-module), domain types, persistence, contracts, and frontend client that all three user stories build on.

**⚠️ CRITICAL**: No user story task can begin until this phase is complete.

- [X] T005 [P] Define the `CurrentSessionResolver` port (`resolve(request): { accountId, role } | null`) in `apps/backend/src/modules/instructor-assignment/domain/ports/` (Constitution II cross-module port — a third independently-declared instance of the same shape 002/004 already introduced)
- [X] T006 [P] Define the `AccountRoleWriter` port (`assignInstructorRole(accountId): Promise<void>`) in `apps/backend/src/modules/instructor-assignment/domain/ports/` (cross-module — `auth` implements)
- [X] T007 [P] Define the `AccountLookup` port (`findById`/`findByEmail` → `{ accountId, email, role, status } | null`) in `apps/backend/src/modules/instructor-assignment/domain/ports/` (local — `instructor-assignment` implements it itself, research.md #2)
- [X] T008 [P] Define the `InstructorInvitationRepository` port (`create`, `findPendingByEmail`, `findById`, `markCancelled`, `markResolved`, `listPending`) in `apps/backend/src/modules/instructor-assignment/domain/ports/`
- [X] T009 [P] Define the `RoleAssignmentAuditRepository` port (`append`) in `apps/backend/src/modules/instructor-assignment/domain/ports/`
- [X] T010 [P] Create the `InstructorInvitation` and `RoleAssignmentAuditEntry` domain entity types in `apps/backend/src/modules/instructor-assignment/domain/entities/`
- [X] T011 [P] Define the `AccountCreatedEvent` payload type (`{ accountId, email }`) in `apps/backend/src/shared/events/` (not either module's own `domain/` — neither module owns this shape exclusively; see research.md #1)
- [X] T012 Implement the `CurrentSessionResolver` adapter (third instance), wrapping `auth`'s existing session machinery, in `apps/backend/src/modules/auth/infrastructure/instructor-assignment-bridge/`, registered against the port and exported from `apps/backend/src/modules/auth/auth.module.ts`
- [X] T013 Implement the `AccountRoleWriter` adapter, wrapping `auth`'s existing `AccountRepository`, in `apps/backend/src/modules/auth/infrastructure/instructor-assignment-bridge/`, registered against the port and exported from `apps/backend/src/modules/auth/auth.module.ts`
- [X] T014 [P] Implement the Prisma-backed `AccountLookup` (reads `Account.role`/`email`/`status` directly via the shared Prisma client — research.md #2) in `apps/backend/src/modules/instructor-assignment/infrastructure/persistence/`
- [X] T015 [P] Implement the Prisma-backed `InstructorInvitationRepository` in `apps/backend/src/modules/instructor-assignment/infrastructure/persistence/`
- [X] T016 [P] Implement the Prisma-backed `RoleAssignmentAuditRepository` in `apps/backend/src/modules/instructor-assignment/infrastructure/persistence/`
- [X] T017 [P] Define the `instructor-assignment` contracts (promote/invite/list/cancel request/response/errors + Zod schemas, per `contracts/instructor-assignment-endpoints.md`) in `packages/contracts/src/instructor-assignment/assignment.contract.ts`
- [X] T018 [P] Implement the frontend `instructor-assignment-client.ts` typed against the contracts in `apps/frontend/src/services/instructor-assignment-client.ts`

**Checkpoint**: Foundation ready — all three user stories can now proceed.

---

## Phase 3: User Story 1 - Promover a instructor a un usuario ya registrado (Priority: P1) 🎯 MVP

**Goal**: An administrador picks an existing skater from 002's unmodified listing and promotes them to instructor immediately.

**Independent Test**: Log in as `administrador`, call `POST /instructor-assignment/existing/:accountId` for a seeded skater — verify the response is `200 { status: "ok" }`, the account's role is now `instructor`, and a `RoleAssignmentAuditLog` row exists with `method: "existing_user"`.

- [X] T019 [P] [US1] Implement the `PromoteExistingUserToInstructor` use case (reads via `AccountLookup`, rejects with `no_op`/`already_instructor` or `already_administrador` per FR-007/FR-008, otherwise writes via `AccountRoleWriter` and appends an audit row with `method: "existing_user"` — FR-001, FR-002, FR-014) in `apps/backend/src/modules/instructor-assignment/application/use-cases/`
- [X] T020 [US1] Implement the `AdminOnlySessionGuard` (`role === "administrador"` only, rejecting `instructor` too — research.md #4, FR-006) in `apps/backend/src/modules/instructor-assignment/infrastructure/http/`
- [X] T021 [US1] Implement the `POST /instructor-assignment/existing/:accountId` controller in `apps/backend/src/modules/instructor-assignment/infrastructure/http/instructor-assignment.controller.ts`
- [X] T022 [P] [US1] Build the `InstructorAssignmentView` React island — promotion picker section, reusing `skaterDirectoryClient.listSkaters` for search per Clarifications (no new listing endpoint) — in `apps/frontend/src/components/InstructorAssignmentView.tsx`
- [X] T023 [US1] Create the `/instructors` Astro page embedding `InstructorAssignmentView` in `apps/frontend/src/pages/instructors.astro`

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Invitar como instructor a alguien sin cuenta todavía (Priority: P1)

**Goal**: An administrador reserves the instructor role for an email with no account; the role is applied automatically the moment that email registers, by any standard method.

**Independent Test**: Call `POST /instructor-assignment/invite` with a new email — verify `200 { status: "ok", outcome: "invited" }`; then register that exact email via 001's `/register` flow — verify the resulting account has `role: "instructor"` (not the default `skater`) and the invitation is `resolved`.

- [X] T024 [P] [US2] Implement the `AssignInstructorByEmail` use case (via `AccountLookup` by email: if an account already exists, delegate to the same promotion path as `PromoteExistingUserToInstructor` — `outcome: "promoted_existing"`, `method: "existing_user"`, FR-010; otherwise reject duplicates per FR-009 via `InstructorInvitationRepository.findPendingByEmail`, then create the invitation — `outcome: "invited"`) in `apps/backend/src/modules/instructor-assignment/application/use-cases/`
- [X] T025 [P] [US2] Implement the `ConsumePendingInvitationOnAccountCreated` use case (looks up a pending invitation by the new account's email via `InstructorInvitationRepository`; if found, writes the role via `AccountRoleWriter`, marks the invitation resolved, and appends an audit row with `method: "email_invite"` at this moment, not at invitation-creation time — FR-004, FR-014, data-model.md) in `apps/backend/src/modules/instructor-assignment/application/use-cases/`
- [X] T026 [US2] Implement the `@OnEvent('account.created')` listener wiring `ConsumePendingInvitationOnAccountCreated` in `apps/backend/src/modules/instructor-assignment/infrastructure/events/`
- [X] T027 [US2] Emit the `account.created` event via `emitAsync`, **awaited** before returning (research.md #1), from `apps/backend/src/modules/auth/application/use-cases/register-account.use-case.ts` after successful account creation
- [X] T028 [US2] Emit the same awaited `account.created` event from the new-account-creation branch only (not the auto-link or existing-account branches) of `apps/backend/src/modules/auth/application/use-cases/login-with-google.use-case.ts`
- [X] T029 [US2] Implement the `POST /instructor-assignment/invite` controller (validates email format — FR-012) in `apps/backend/src/modules/instructor-assignment/infrastructure/http/instructor-assignment.controller.ts`
- [X] T030 [P] [US2] Add the invite-by-email form section to `InstructorAssignmentView.tsx`, embedded in the existing `/instructors` page from T023

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Cancelar una invitación de instructor pendiente (Priority: P2)

**Goal**: An administrador can see pending invitations and cancel one so it no longer applies to a future registration.

**Independent Test**: Create an invitation, call `GET /instructor-assignment/invitations` — verify it appears; call the cancel endpoint — verify it returns `200`, no longer appears in the pending list, and a subsequent registration with that email gets the default `skater` role.

- [X] T031 [P] [US3] Implement the `ListPendingInstructorInvitations` use case in `apps/backend/src/modules/instructor-assignment/application/use-cases/`
- [X] T032 [P] [US3] Implement the `CancelInstructorInvitation` use case (only a `pending` invitation may be cancelled — data-model.md) in `apps/backend/src/modules/instructor-assignment/application/use-cases/`
- [X] T033 [US3] Implement the `GET /instructor-assignment/invitations` and `POST /instructor-assignment/invitations/:invitationId/cancel` controllers in `apps/backend/src/modules/instructor-assignment/infrastructure/http/instructor-assignment.controller.ts`
- [X] T034 [P] [US3] Add the pending-invitations list + cancel button section to `InstructorAssignmentView.tsx`

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consistency and quality gates that span all three user stories.

- [X] T035 [P] Add structured logging for `instructor-assignment` writes (mirrors `auth`'s/`skater-profile`'s/`skater-directory`'s `*-logger.service.ts` pattern) in `apps/backend/src/modules/instructor-assignment/infrastructure/http/`
- [X] T036 Run and validate all 8 `quickstart.md` scenarios end-to-end, checking off its Success Criteria checklist (SC-001–SC-005)
- [X] T037 [P] Verify Biome lint/format passes across `apps/backend`, `apps/frontend`, and `packages/contracts` (Constitution V gate) — clean for this feature's files; 4 pre-existing warnings in unrelated auth files left as-is

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all three user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion. US1 and US2 (both P1) can proceed in parallel with each other; US3 (P2) too, though its controller (T033) and its frontend section (T034) share files with the other two stories' equivalents (T021/T029 and T022/T030), so sequence those relative to each other if working solo.
- **Polish (Phase 6)**: Depends on the user stories it touches being complete (T036 needs all three stories done to run the full quickstart).

### Within Each User Story

- Ports + persistence + contracts (Foundational) before any story-specific use case.
- Use case before the controller that wires it up.
- Backend controller before the frontend component/page that calls it.
- `PromoteExistingUserToInstructor` (T019, US1) before `AssignInstructorByEmail` (T024, US2),
  which reuses its promotion logic for the "email matches an existing account" branch (FR-010).

### Parallel Opportunities

- Foundational tasks marked `[P]` (T005–T011, T014–T018) can run in parallel once their own listed dependencies are satisfied; T012/T013 depend on T005/T006 respectively.
- Once Foundational is complete, Phases 3, 4, and 5 can be staffed and run in parallel by different people, with the shared-file caveats above.

---

## Parallel Example: Foundational Phase

```bash
# These have no dependencies on each other:
Task: "Define the CurrentSessionResolver port in apps/backend/src/modules/instructor-assignment/domain/ports/"
Task: "Define the AccountRoleWriter port in apps/backend/src/modules/instructor-assignment/domain/ports/"
Task: "Define the AccountLookup port in apps/backend/src/modules/instructor-assignment/domain/ports/"
Task: "Define the InstructorInvitationRepository port in apps/backend/src/modules/instructor-assignment/domain/ports/"
Task: "Define the RoleAssignmentAuditRepository port in apps/backend/src/modules/instructor-assignment/domain/ports/"
Task: "Create the InstructorInvitation and RoleAssignmentAuditEntry domain entity types"
Task: "Define the instructor-assignment contracts in packages/contracts/src/instructor-assignment/assignment.contract.ts"
```

## Parallel Example: User Stories 1 & 2

```bash
# Once Foundational is complete, these can be staffed independently:
Task: "Build POST /instructor-assignment/existing/:accountId + promotion picker (US1)"
Task: "Build POST /instructor-assignment/invite + the account.created event flow (US2)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocks everything else).
3. Complete Phase 3: User Story 1 — promote an existing user.
4. **STOP and VALIDATE**: run Scenarios 1 and 2 from `quickstart.md` independently.
5. This is a legitimate MVP: an administrador can already turn any existing skater into an
   instructor before the email-invitation or cancellation capabilities land.

### Incremental Delivery

1. Setup + Foundational → shared ports/persistence/contracts/client ready.
2. Add US1 (promote existing) → validate independently → MVP.
3. Add US2 (email invitation, registration-time auto-assignment) → validate independently.
4. Add US3 (cancel pending) → validate independently → run the full `quickstart.md` (all 8
   scenarios).
5. Phase 6 polish (logging, lint gate) once all three stories are in.

### Parallel Team Strategy

With multiple developers, after Setup + Foundational are done together:
- Developer A: User Story 1 (promote existing user)
- Developer B: User Story 2 (email invitation + registration hook)
- Developer C: User Story 3 (cancel pending)

All three depend only on the Foundational phase; US2 additionally reuses US1's core promotion
logic for its "email matches an existing account" branch, so sequence US1 before US2 if working
solo.
