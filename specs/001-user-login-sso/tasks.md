---

description: "Task list for 001-user-login-sso implementation"
---

# Tasks: Login Principal con Credenciales, Recuperación y SSO de Google

**Input**: Design documents from `/specs/001-user-login-sso/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-endpoints.md, quickstart.md

**Tests**: Not explicitly requested in spec.md or by the user for this feature — no dedicated test tasks are included below. `plan.md`'s Technical Context still fixes `bun test` as the test runner for whenever tests are added later.

**Organization**: Tasks are grouped by user story (from spec.md, in priority order) to enable independent implementation and testing of each story. This is also the first feature in the repo, so Phase 1/2 bootstrap the Nx monorepo skeleton fixed by `plan.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- File paths are exact and repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Nx monorepo skeleton fixed by `plan.md` — nothing below exists on disk yet.

- [X] T001 Initialize Bun-based Nx workspace at repo root: `package.json`, `nx.json`, `biome.json`, `bunfig.toml` (Constitution I, V)
- [X] T002 [P] Scaffold `apps/backend` NestJS project via Nx generator, configured to run on Bun
- [X] T003 [P] Scaffold `apps/frontend` Astro + React project via Nx generator, configured to run on Bun
- [X] T004 [P] Scaffold `packages/contracts` TypeScript package with a Zod dependency, wired into the Nx project graph
- [X] T005 [P] Write `apps/backend/Dockerfile` (Constitution IV)
- [X] T006 [P] Write `apps/frontend/Dockerfile` (Constitution IV)
- [X] T007 [P] Initialize Prisma in `apps/backend` (`prisma init`, PostgreSQL datasource config) in `apps/backend/prisma/`
- [X] T008 [P] Configure `bun test` runner + `happy-dom` preload for `apps/frontend`, and `bun test` config for `apps/backend`
- [X] T009 [P] Configure neobrutalist design tokens (black `#000000`, white `#ffffff`, grayscale, yellow `#ece315`/`#ebe212` accent) in `apps/frontend/src/styles/tokens.css` (Constitution VI)

**Checkpoint**: Monorepo skeleton exists; both apps and the contracts package build.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain/persistence/session infrastructure that every user story below needs.

**⚠️ CRITICAL**: No user story task can begin until this phase is complete.

- [X] T010 Define Prisma schema for `Account`, `Session`, `PasswordResetRequest` per `data-model.md` in `apps/backend/prisma/schema.prisma`
- [X] T011 Run the initial Prisma migration against PostgreSQL
- [X] T012 [P] Create domain entity types (`Account`, `Session`, `PasswordResetRequest`) in `apps/backend/src/modules/auth/domain/entities/`
- [X] T013 [P] Define domain ports (`AccountRepository`, `SessionRepository`, `PasswordResetRepository`, `PasswordHasher`, `EmailSender`, `GoogleIdentityVerifier`) in `apps/backend/src/modules/auth/domain/ports/`
- [X] T014 Implement the Prisma-backed `AccountRepository` in `apps/backend/src/modules/auth/infrastructure/persistence/account.repository.ts`
- [X] T015 Implement the Prisma-backed `SessionRepository` in `apps/backend/src/modules/auth/infrastructure/persistence/session.repository.ts`
- [X] T016 Implement the Prisma-backed `PasswordResetRepository` in `apps/backend/src/modules/auth/infrastructure/persistence/password-reset.repository.ts`
- [X] T017 [P] Implement the Argon2id `PasswordHasher` adapter in `apps/backend/src/modules/auth/infrastructure/auth/argon2-password-hasher.ts`
- [X] T018 Implement the session cookie issuance/validation guard (httpOnly, `Secure`, `SameSite=Lax`) in `apps/backend/src/modules/auth/infrastructure/http/session.guard.ts`
- [X] T019 [P] Configure the global error-handling filter and structured logging in `apps/backend/src/modules/auth/infrastructure/http/http-exception.filter.ts`
- [X] T020 [P] Configure the environment/config module (DB URL, cookie settings, Google OAuth + Resend placeholders) in `apps/backend/src/shared/config/app-config.module.ts` (cross-cutting, no single module owner — Constitution II carve-out)
- [X] T021 [P] Implement the `EmailSender` adapter (Resend + a dev/test capture variant used by `quickstart.md` — originally shipped as an SMTP/nodemailer adapter, replaced by T056 per Constitution VIII) in `apps/backend/src/modules/auth/infrastructure/email/` — shared by US3 and US4
- [X] T022 [P] Scaffold the shared error-shape types in `packages/contracts/src/auth/errors.ts`, reused by every auth contract

**Checkpoint**: Foundation ready — user stories 1–4 can now proceed in any order (or in parallel).

---

## Phase 3: User Story 1 - Iniciar sesión con credenciales (Priority: P1) 🎯 MVP

**Goal**: An existing account (any role) logs in with email + password and lands in the MainApp; wrong/nonexistent credentials, deactivated accounts, and lockouts are all rejected with the correct generic messaging.

**Independent Test**: Seed an `Account` row directly (Argon2id hash) and call `POST /auth/login` — verify a session cookie is set on success, `401 invalid_credentials` on wrong password or unknown email (identical response either way), and `403 account_unavailable` for a deactivated or locked-out account.

- [X] T023 [P] [US1] Define the login contract (request/response/errors, per `contracts/auth-endpoints.md`) in `packages/contracts/src/auth/login.contract.ts`
- [X] T024 [US1] Implement the `LockoutPolicy` domain service (5 failed attempts → 15-minute lock, reset on success — FR-015) in `apps/backend/src/modules/auth/domain/services/lockout-policy.ts`
- [X] T025 [US1] Implement the `LoginWithCredentials` use case (validates credentials, applies `LockoutPolicy`, rejects deactivated accounts FR-016, issues a session) in `apps/backend/src/modules/auth/application/use-cases/login-with-credentials.use-case.ts`
- [X] T026 [US1] Implement the `POST /auth/login` controller, wired to the use case and the login contract, in `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts`
- [X] T027 [P] [US1] Build the `LoginForm` React island (neobrutalist styling, per Constitution VI) in `apps/frontend/src/components/LoginForm.tsx`
- [X] T028 [US1] Implement the frontend auth API client's login method, typed against the login contract, in `apps/frontend/src/services/auth-client.ts`
- [X] T029 [US1] Create the `/login` Astro page embedding `LoginForm` in `apps/frontend/src/pages/login.astro`
- [X] T030 [US1] Wire the generic, non-distinguishing error messaging (`invalid_credentials` / `account_unavailable`) into `LoginForm` (FR-003, FR-016)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Iniciar sesión con Google (SSO) (Priority: P1)

**Goal**: A user authenticates via Google from the login view and lands in the MainApp; a cancelled/failed Google auth returns them to login with a clear message.

**Independent Test**: Hit `GET /auth/google`, complete the Google consent screen with a test account — verify the callback resolves/creates the account and sets a session cookie. Separately, cancel consent and verify a redirect back to `/login` with a "didn't complete" message and no cookie set.

- [X] T031 [P] [US2] Define the Google SSO contract (start + callback behavior, per `contracts/auth-endpoints.md`) in `packages/contracts/src/auth/google-sso.contract.ts`
- [X] T032 [US2] Implement the `GoogleIdentityVerifier` adapter (`passport-google-oauth20` strategy) in `apps/backend/src/modules/auth/infrastructure/auth/google.strategy.ts`
- [X] T033 [US2] Implement the `LoginWithGoogle` use case (resolves/creates the account by email per FR-005/FR-012/FR-017, rejects deactivated accounts FR-016, issues a session) in `apps/backend/src/modules/auth/application/use-cases/login-with-google.use-case.ts`
- [X] T034 [US2] Implement the `GET /auth/google` and `GET /auth/google/callback` controllers in `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts`
- [X] T035 [P] [US2] Build the `GoogleSignInButton` React island (neobrutalist styling) in `apps/frontend/src/components/GoogleSignInButton.tsx`
- [X] T036 [US2] Add `GoogleSignInButton` and cancellation/failure messaging to `apps/frontend/src/pages/login.astro`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Recuperar contraseña olvidada (Priority: P2)

**Goal**: A user requests a password reset, receives instructions, sets a new password, and can log in with it.

**Independent Test**: Submit an email to `POST /auth/password-reset/request` (verify identical `200` response whether or not the email exists — FR-007), retrieve the token via the dev email-capture adapter, confirm the reset, then log in with the new password. Reusing the same token afterward must fail.

- [X] T037 [P] [US3] Define the password-recovery contract (request/confirm, per `contracts/auth-endpoints.md`) in `packages/contracts/src/auth/password-recovery.contract.ts`
- [X] T038 [US3] Implement the `RequestPasswordReset` use case (creates a `PasswordResetRequest`, sends the email via `EmailSender`, non-distinguishing response FR-007) in `apps/backend/src/modules/auth/application/use-cases/request-password-reset.use-case.ts`
- [X] T039 [US3] Implement the `ConfirmPasswordReset` use case (validates token/expiry FR-008, updates the password hash, marks the request used) in `apps/backend/src/modules/auth/application/use-cases/confirm-password-reset.use-case.ts`
- [X] T040 [US3] Implement the `POST /auth/password-reset/request` and `POST /auth/password-reset/confirm` controllers in `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts`
- [X] T041 [P] [US3] Build the `ForgotPasswordForm` and `ResetPasswordForm` React islands (neobrutalist styling) in `apps/frontend/src/components/`
- [X] T042 [US3] Create the `/forgot-password` and `/reset-password` Astro pages embedding the forms from T041 in `apps/frontend/src/pages/`

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Crear una cuenta nueva (Priority: P2)

**Goal**: A new visitor registers with email + password, gets a `skater`-role account (FR-011), and is guided to verify their email before they can log in (FR-013).

**Independent Test**: Submit `POST /auth/register` with a new email — verify `201`, `role = skater`, and login blocked until verification. Repeat with the same email — verify `409 email_already_registered` with no account details leaked.

- [X] T043 [P] [US4] Define the register contract (request/response/errors, per `contracts/auth-endpoints.md`) in `packages/contracts/src/auth/register.contract.ts`
- [X] T044 [US4] Implement the `RegisterAccount` use case (creates the account with `role = skater` FR-011, enforces email uniqueness FR-010, rejects registration on a Google-linked email with a distinct `google_account_exists` error directing the user to sign in with Google FR-017) in `apps/backend/src/modules/auth/application/use-cases/register-account.use-case.ts`
- [X] T045 [US4] Implement email-verification token issuance and the `VerifyEmail` use case (gates first login per FR-013) in `apps/backend/src/modules/auth/application/use-cases/verify-email.use-case.ts`
- [X] T046 [US4] Implement the `POST /auth/register` controller and the email-verification endpoint in `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts`
- [X] T047 [P] [US4] Build the `RegisterForm` React island (neobrutalist styling) in `apps/frontend/src/components/RegisterForm.tsx`
- [X] T048 [US4] Create the `/register` Astro page embedding `RegisterForm`, with post-registration guidance messaging (FR-009 scenario 3), in `apps/frontend/src/pages/register.astro`

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Session lifecycle and quality gates that span every user story above.

- [X] T049 [P] Implement `ValidateSession`/`Logout` use cases and the `GET /auth/session` / `POST /auth/logout` endpoints in `apps/backend/src/modules/auth/application/use-cases/` and `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts`
- [X] T050 [P] Add structured security-event logging (login attempts, lockouts, password resets) for all auth endpoints in `apps/backend/src/modules/auth/infrastructure/http/`
- [X] T051 Run and validate all 7 `quickstart.md` scenarios end-to-end, checking off its Success Criteria checklist (SC-001–SC-006) — SC-002/Scenario 2's full Google consent round-trip and Scenario 7's live cross-method link still need a real Google OAuth2 client (see quickstart.md notes)
- [X] T052 [P] Verify Biome lint/format passes across `apps/backend`, `apps/frontend`, and `packages/contracts` (Constitution V gate)
- [X] T053 [P] Verify `apps/backend/Dockerfile` and `apps/frontend/Dockerfile` each build independently (Constitution IV gate)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3–6)**: All depend on Foundational completion. US1 and US2 (both P1) can proceed in parallel with each other; US3 and US4 (both P2) likewise. None of the four stories depend on another for its own controller/use case/UI to work, though US3 and US4 both rely on the shared `EmailSender` built in Foundational (T021).
- **Polish (Phase 7)**: Depends on the user stories it touches being complete (T049 needs at least one of US1/US2 to have something to validate a session against; T051 needs all four stories done to run the full quickstart).

### Within Each User Story

- Contract definition before the use case that implements against it.
- Use case before the controller that wires it up.
- Backend controller before the frontend API client method that calls it.
- Frontend component before the Astro page that embeds it.

### Parallel Opportunities

- All Setup tasks marked `[P]` (T002–T009) can run in parallel once T001 is done.
- All Foundational tasks marked `[P]` (T012, T013, T017, T019, T020, T021, T022) can run in parallel once T010/T011 are done, subject to their own listed dependencies.
- Once Foundational is complete, Phases 3, 4, 5, and 6 can be staffed and run in parallel by different people.
- Within each story, the contract task and the first frontend component task are typically parallelizable with each other and with unrelated backend tasks (see per-story `[P]` markers).

---

## Parallel Example: User Story 1

```bash
# Contract + first UI component can start together (different files, no shared dependency):
Task: "Define the login contract in packages/contracts/src/auth/login.contract.ts"
Task: "Build the LoginForm React island in apps/frontend/src/components/LoginForm.tsx"
```

## Parallel Example: Foundational Phase

```bash
# After T010/T011 (schema + migration), these have no dependencies on each other:
Task: "Create domain entity types in apps/backend/src/modules/auth/domain/entities/"
Task: "Define domain ports in apps/backend/src/modules/auth/domain/ports/"
Task: "Implement the Argon2id PasswordHasher adapter in apps/backend/src/modules/auth/infrastructure/auth/argon2-password-hasher.ts"
Task: "Configure the global error-handling filter in apps/backend/src/modules/auth/infrastructure/http/http-exception.filter.ts"
Task: "Configure the environment/config module in apps/backend/src/shared/config/app-config.module.ts"
Task: "Implement the EmailSender adapter in apps/backend/src/modules/auth/infrastructure/email/"
Task: "Scaffold shared error-shape types in packages/contracts/src/auth/errors.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocks everything else).
3. Complete Phase 3: User Story 1 — credential login.
4. **STOP and VALIDATE**: run Scenario 1 (and 5, 6 for deactivated/lockout) from `quickstart.md` independently.
5. This is a legitimate MVP: any account created directly in the DB can already log in and reach the MainApp.

### Incremental Delivery

1. Setup + Foundational → monorepo and auth infrastructure ready.
2. Add US1 (credential login) → validate independently → MVP.
3. Add US2 (Google SSO) → validate independently.
4. Add US3 (password recovery) → validate independently.
5. Add US4 (self-registration) → validate independently — this is also what makes the whole
   flow usable end-to-end without manually seeding accounts, so run the full `quickstart.md`
   (all 7 scenarios) once it lands.
6. Phase 7 polish (session/logout endpoints, logging, lint/Docker gates) once all four stories
   are in.

### Parallel Team Strategy

With multiple developers, after Setup + Foundational are done together:
- Developer A: User Story 1 (credential login)
- Developer B: User Story 2 (Google SSO)
- Developer C: User Story 3 (password recovery)
- Developer D: User Story 4 (registration)

All four depend only on the Foundational phase, not on each other, so they can proceed
concurrently and each be demoed/tested independently.

---

## Phase 8: Convergence

**Purpose**: Close gaps found by `/speckit-converge` between the current spec (post-clarify, FR-018) and the implemented code.

- [X] T054 Add a typed `session()` method to `apps/frontend/src/services/auth-client.ts`, calling `GET /auth/session` against `SESSION_ROUTE`/`sessionResponseSchema` from `packages/contracts/src/auth/session.contract.ts` per FR-018 (missing)
- [X] T055 Add a client-side session-check guard to `apps/frontend/src/pages/login.astro` (Astro output is `static`, no SSR — the check must run client-side) that calls `authClient.session()` on mount and redirects to `/` when `authenticated: true`, per FR-018 (missing)

---

## Phase 9: Convergence

**Purpose**: Close a gap found by `/speckit-converge` between the constitution (amended to v2.1.0, adding Principle VIII) and the implemented code.

- [X] T056 CRITICAL Replace `SmtpEmailSender` (`apps/backend/src/modules/auth/infrastructure/email/smtp-email-sender.ts`, nodemailer/raw SMTP) with a Resend-backed `EmailSender` implementation, update `EmailModule`'s provider selection (`apps/backend/src/modules/auth/infrastructure/email/email.module.ts`) and `AppConfigService`'s email-adapter config accordingly; keep `DevCaptureEmailSender` unchanged for local/dev capture; correct `research.md`'s decision #6 (SMTP) to reflect Resend, per Constitution VIII (contradicts)
