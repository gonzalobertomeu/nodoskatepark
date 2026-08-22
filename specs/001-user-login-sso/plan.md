# Implementation Plan: Login Principal con Credenciales, Recuperación y SSO de Google

**Branch**: `001-user-login-sso` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-user-login-sso/spec.md`

## Summary

Single, common login screen for every account role (skater, instructor, administrador):
email/password sign-in, Google SSO, password recovery, and self-registration (which always
creates a **skater** account). On success the user lands in the MainApp. Auth-method linking is
automatic by email (FR-017), deactivated accounts are rejected with a generic message (FR-016),
and repeated failed attempts trigger a 5-attempts/15-minute lockout (FR-015). Technical approach:
a NestJS backend (module-first Clean Architecture: `src/modules/auth/{domain,application,infrastructure}/`)
owns all auth state and issues an httpOnly, server-revocable session cookie; the Astro+React frontend renders the login
UI as neobrutalist islands and talks to the backend exclusively through typed contracts in
`packages/contracts/`. This is the first feature being planned in the repo, so this plan also
fixes the initial Nx monorepo skeleton (`apps/backend`, `apps/frontend`, `packages/contracts`)
that subsequent features will build on.

## Technical Context

**Language/Version**: TypeScript 5.x, running on Bun 1.x (both backend and frontend build/dev/test tooling).

**Primary Dependencies**:
- Backend: NestJS, Passport (`passport-local`, `passport-google-oauth20`), Prisma (ORM),
  Argon2 (password hashing).
- Frontend: Astro, React 18+ (islands for interactive login/register/recovery forms).
- Shared: `packages/contracts` (TypeScript request/response/error types + a thin typed client),
  Zod (runtime validation of contract payloads on both sides).

**Storage**: PostgreSQL — relational store for accounts, sessions, and password-reset requests;
consistent, ACID guarantees needed for unique-email enforcement (FR-010) and lockout counters
(FR-015) under concurrent login attempts.

**Testing**: Bun's built-in test runner (`bun test`) for both apps, per Constitution Principle I
(single Bun-first toolchain). Backend: unit tests for `domain`/`application` (pure, no NestJS
bootstrap) plus HTTP-level integration tests against a running Nest app instance. Frontend:
component tests via `@testing-library/react` under Bun's `happy-dom` preload.

**Target Platform**: Linux containers (Docker) for both apps in all environments; browsers
(current evergreen versions) for the frontend.

**Project Type**: Web application — Nx monorepo, backend + frontend, per Constitution
Technology Stack.

**Performance Goals**: Auth endpoints respond within ~300ms p95 under normal load (reasonable
default; the spec's measurable targets — SC-001/SC-002 — are end-to-end UX timings, not raw
throughput, and are validated in `quickstart.md` rather than load-tested here).

**Constraints**:
- Passwords hashed with Argon2id; never stored or logged in plaintext.
- Session is an opaque, server-side-revocable token in an httpOnly, secure, `SameSite=Lax`
  cookie — not a self-contained JWT — so a deactivated account (FR-016) or explicit logout takes
  effect immediately without a blocklist.
- Every state-changing auth endpoint (login, register, password reset, Google callback) is
  defined in `packages/contracts` before either app implements/consumes it (Constitution
  Principle III).
- Login/register/recovery UI uses the neobrutalist style and brand palette (Constitution
  Principle VI).

**Scale/Scope**: Tens to a few thousand accounts (single skatepark), consistent with the scale
assumption already documented in `002-staff-skater-directory/spec.md`. No multi-tenant or
high-throughput requirements.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Bun-First Runtime & Tooling | Backend and frontend both build/run/test on Bun; no non-Bun runtime introduced. | PASS |
| II. Module-First Clean Architecture Layering | Backend organized module-first under `src/modules/auth/`, with the `domain/` (Account, Session, PasswordResetRequest, ports), `application/` (use cases), `infrastructure/` (NestJS controllers, Prisma, Passport strategies, email adapter) split applied inside that module directory. `domain/` has zero NestJS/Prisma imports. Cross-cutting, no-single-owner infrastructure (app config, the shared Prisma client) lives in top-level `src/shared/`, each exposed through its own NestJS module, per the constitution's explicit carve-out. | PASS |
| III. Contracts as Source of Truth | All auth endpoints defined in `packages/contracts/src/auth/` before implementation (Phase 1 output). Backend implements against them; frontend consumes them via a typed client — no hand-duplicated types. | PASS |
| IV. Isolated, Containerized Sub-Apps | `apps/backend` and `apps/frontend` each get their own Dockerfile; frontend never imports backend source, only `packages/contracts` and the network API. | PASS |
| V. Monorepo Tooling Consistency (Nx + Biome) | This feature bootstraps the Nx workspace and Biome config, since none exists yet; all build/test/lint tasks run through Nx targets. | PASS (bootstrap work tracked in `/speckit-tasks`, not performed by this plan) |
| VI. Neobrutalist Design System & Brand Palette | Login/register/recovery screens use neobrutalist components and the black/white/gray/yellow palette; no colors outside that set. | PASS |
| VII. Ubiquitous Role Language | Data model and contracts use `skater`/`instructor`/`administrador`/`staff` exclusively — no `miembro` in code/contracts. | PASS |

No violations identified. **Complexity Tracking is not needed.**

**Post-Phase 1 re-check**: `data-model.md` keeps ORM types (Prisma) confined to
`src/modules/auth/infrastructure/persistence/`, matching `src/modules/auth/domain/entities/`
conceptually but not by import — the domain entities in `data-model.md` are plain types.
`contracts/auth-endpoints.md` introduces no endpoint outside `packages/contracts`'s ownership,
and `quickstart.md` introduces no new component/tooling. All rows above still PASS after design;
no re-evaluation changes.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-login-sso/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── auth-endpoints.md
└── tasks.md               # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

None of this exists on disk yet — this feature establishes it. Later features extend the same
skeleton; they do not re-decide it.

```text
apps/
├── backend/                          # NestJS, module-first Clean Architecture (Constitution II)
│   ├── src/
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── domain/
│   │   │       │   ├── entities/         # Account, Session, PasswordResetRequest
│   │   │       │   ├── ports/            # AccountRepository, SessionRepository,
│   │   │       │   │                     #   PasswordResetRepository, PasswordHasher,
│   │   │       │   │                     #   EmailSender, GoogleIdentityVerifier
│   │   │       │   └── services/         # LockoutPolicy
│   │   │       ├── application/
│   │   │       │   └── use-cases/        # LoginWithCredentials, LoginWithGoogle,
│   │   │       │                         #   RegisterAccount, RequestPasswordReset,
│   │   │       │                         #   ConfirmPasswordReset, Logout, ValidateSession,
│   │   │       │                         #   VerifyEmail
│   │   │       ├── infrastructure/
│   │   │       │   ├── http/             # auth.controller, session.guard,
│   │   │       │   │                     #   http-exception.filter, security-logger
│   │   │       │   ├── persistence/      # Prisma-backed repository implementations
│   │   │       │   ├── auth/             # Passport local + Google OAuth2 strategies,
│   │   │       │   │                     #   Argon2id hasher, email-verification tokens
│   │   │       │   └── email/            # EmailSender adapter (Resend + dev-capture)
│   │   │       └── auth.module.ts
│   │   └── shared/                       # cross-cutting, no single module owner (Constitution II)
│   │       ├── config/                   # AppConfigModule (DB URL, cookie, OAuth/Resend config)
│   │       └── persistence/              # shared PrismaService + PersistenceModule
│   ├── prisma/                       # schema.prisma + migrations (not module-scoped)
│   ├── test/                         # mirrors src/ (unit + HTTP integration)
│   └── Dockerfile
│
├── frontend/                         # Astro + React
│   ├── src/
│   │   ├── pages/                    # /login, /register, /forgot-password, /reset-password
│   │   ├── components/               # LoginForm, RegisterForm, GoogleSignInButton,
│   │   │                             #   ForgotPasswordForm, ResetPasswordForm (React islands)
│   │   └── services/                 # typed API client built on packages/contracts
│   ├── test/
│   └── Dockerfile
│
packages/
└── contracts/
    └── src/
        └── auth/                     # login, register, google-sso, password-recovery,
                                       #   session/logout contract definitions + Zod schemas
```

**Structure Decision**: Web application monorepo (Constitution "Option 2" shape), Nx-managed.
Two containerized apps (`apps/backend`, `apps/frontend`) plus `packages/contracts` as the sole
shared boundary between them, per Constitution Principles III and IV. Backend internals follow
Clean Architecture layering per Principle II.

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
