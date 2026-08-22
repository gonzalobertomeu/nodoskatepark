# Phase 0 Research: Login Principal con Credenciales, Recuperación y SSO de Google

All items below were left open by the Technical Context / Constitution (which fix runtime,
frontend, backend framework, and general architecture, but not the auth-specific choices). Each
is resolved here so Phase 1 design has no outstanding unknowns.

## 1. Session strategy: opaque server-side session vs. self-contained JWT

**Decision**: Opaque session token, stored server-side (in PostgreSQL), handed to the browser
as an httpOnly, `Secure`, `SameSite=Lax` cookie.

**Rationale**: FR-016 requires a deactivated account to be rejected on its *next* login attempt,
and a logout/lockout must take effect immediately. A self-contained JWT would keep working until
it expires unless a revocation/blocklist layer is added — extra infrastructure for no benefit at
this scale (tens to a few thousand accounts, single region). An opaque token looked up against
the `Session` table gives immediate revocation for free and keeps the trust boundary entirely
server-side, which is also easier to reason about for the neobrutalist frontend (pure client,
does not need to parse or validate token internals).

**Alternatives considered**:
- *Self-contained JWT (access + refresh)*: rejected — needs a blocklist/short-TTL dance to satisfy
  FR-016's "immediate" rejection, adding complexity without a corresponding requirement for
  statelessness or multi-service token verification.
- *Third-party session/identity service (e.g., Auth0, Clerk)*: rejected — the spec requires
  first-party control over lockout policy (FR-015), auto-linking rules (FR-017), and the
  skater/instructor/administrador role model (Constitution Principle VII), which are easiest to
  own directly rather than map onto an external provider's model.

## 2. Password hashing algorithm

**Decision**: Argon2id (via a `PasswordHasher` port in `domain`, implemented in `infrastructure`).

**Rationale**: Argon2id is the current OWASP-recommended default for password storage, resistant
to both GPU and side-channel attacks, and has a mature Bun/Node-compatible implementation.

**Alternatives considered**: bcrypt (rejected — weaker under modern GPU cracking, no memory-hardness
parameter) — Argon2id is a strict improvement with no meaningful integration cost difference.

## 3. ORM / persistence layer

**Decision**: Prisma, used only inside `infrastructure/persistence/`, implementing the
domain-defined repository ports (`AccountRepository`, `SessionRepository`,
`PasswordResetRepository`). No Prisma types cross into `domain/` or `application/`.

**Rationale**: Prisma has the most mature migration tooling and NestJS integration story of the
TypeScript ORM options, which matters most for the *first* feature in the repo — it sets the
persistence pattern every later feature (002, 003, ...) will reuse. Its generated client is fully
typed, which pairs well with the contracts-first principle (types flow from schema → repository →
contract, not hand-maintained in three places).

**Alternatives considered**:
- *Drizzle*: attractive for being closer to raw SQL and very fast under Bun, but rejected for now
  — smaller migration-tooling surface and less NestJS-specific precedent; revisit if Prisma's
  overhead becomes a real problem.
- *TypeORM*: rejected — Active Record and Data Mapper modes both encourage entity classes that
  are harder to keep out of `domain/` than Prisma's separately-generated client.

## 4. Google SSO integration

**Decision**: `passport-google-oauth20` strategy inside `infrastructure/auth/`, using the
standard OAuth2 Authorization Code flow: the frontend links to a backend `GET /auth/google`
endpoint, which redirects to Google, and Google redirects back to a backend callback endpoint
that establishes the session and then redirects the browser into the MainApp.

**Rationale**: This keeps the Google client secret entirely server-side (never exposed to the
Astro/React frontend), and reuses the same session-issuing code path as credential login (FR-005
requires equivalent treatment after success). It's the standard, well-documented NestJS pattern,
minimizing first-feature risk.

**Alternatives considered**: Frontend-driven Google Identity Services (client-side ID token,
verified by the backend) — rejected for now: it would require exposing a Google client ID
configuration path in the frontend and a token-verification port in the backend for equivalent
security, with no benefit over the redirect flow at this scale; the backend-redirect flow is
simpler to implement and audit for a first pass.

## 5. Failed-login lockout mechanism (FR-015)

**Decision**: Track `failedAttempts` (int) and `lockedUntil` (nullable timestamp) directly on the
`Account` row. On each failed attempt, increment and check the threshold; on success, reset both
fields to zero/null.

**Rationale**: FR-015's policy (5 attempts → 15-minute lock, per-account) needs no cross-account
coordination or high write throughput that would justify a separate cache/rate-limiting service
(e.g., Redis). A DB column keeps it inside the existing transaction boundary (the same query that
validates credentials can also check/update the lock state atomically) and avoids introducing new
infrastructure for the first feature.

**Alternatives considered**: Redis-backed counter — rejected as unnecessary infrastructure at this
scale; revisit only if login volume ever demands it.

## 6. Password-reset token delivery (email)

**Decision**: An `EmailSender` port in `domain`, with a concrete Resend-based adapter
(`ResendEmailSender`) in `infrastructure/email/`. Resend (resend.com) is the monorepo's sole
email delivery provider, per Constitution Principle VIII (added in constitution v2.1.0, after
this feature's initial implementation shipped with a since-replaced SMTP/nodemailer adapter).

**Rationale**: Keeping email delivery behind a port means the provider can be swapped (or mocked
in tests) without touching `domain`/`application`, consistent with Constitution Principle II.
Resend specifically is now a project-wide constitutional pin, not a per-feature choice.

**Alternatives considered**: Provider-specific SDK called directly from the use case — rejected:
would leak an infrastructure concern into `application/`. Raw SMTP (the original decision here)
— superseded by Constitution VIII, which forbids any provider other than Resend.

## 7. Test tooling: `bun test` vs. Vitest/Jest

**Decision**: `bun test` for both apps, with `@testing-library/react` and Bun's `happy-dom`
preload for frontend component tests; `supertest`-style HTTP assertions against a booted Nest
app for backend integration tests.

**Rationale**: Constitution Principle I requires Bun as the default runtime and tooling "wherever
Bun support exists"; `bun test` has first-class DOM-testing support via `happy-dom`/`jsdom`
preloads as of current Bun releases, so no exception is needed here.

**Alternatives considered**: Vitest — mature and Nx-friendly, but introducing it would mean a
second test runner alongside Bun's built-in one with no capability gap it fills; rejected as an
unjustified Principle I exception.
