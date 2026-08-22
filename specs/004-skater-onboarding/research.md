# Phase 0 Research: Onboarding de Datos Básicos del Skater

All items below were left open by the Technical Context (which fixes runtime, frameworks, and
general architecture via 001-user-login-sso's precedent, but not this feature's specific design
choices). Each is resolved here so Phase 1 design has no outstanding unknowns.

## 1. Where the three new fields live: same `Account` table vs. a new `SkaterProfile` table

**Decision**: Add `nombre`, `apellido`, `fechaDeNacimiento` as new nullable columns directly on
the existing `accounts` table, owned and exclusively read/written by the new `skater-profile`
module's persistence layer. The `auth` module's own domain `Account` type is unchanged and never
references them.

**Rationale**: 001-user-login-sso's own `data-model.md` already reserved this exact extension
point ("[fields] belong to 002-staff-skater-directory's 'Perfil de skater', which extends this
same Account row but is owned by that feature"). A separate `SkaterProfile` table would need a
1:1 FK to `accounts` and a join on every read, for no benefit — there's no independent lifecycle
for these fields (they don't exist without an account, and a skater has exactly one of each).
Keeping them as columns on the same row also means `002-staff-skater-directory`'s profile view
(a straight read of one skater) stays a single-table query.

**Alternatives considered**: A dedicated `SkaterProfile` table (1:1 with `Account`) — rejected as
unneeded indirection for data with no independent lifecycle, identity, or cardinality beyond the
account it belongs to; revisit only if a future feature gives skater-profile data genuinely
independent lifecycle (e.g., versioned history) that would benefit from its own table.

## 2. Cross-module session lookup: `skater-profile` needs to know "who is logged in"

**Decision**: `skater-profile` declares an abstract-class port `CurrentSessionResolver` in its
own `domain/ports/` (`resolve(request): Promise<{ accountId: string; role: AccountRole } | null>`).
The `auth` module provides a concrete adapter (in a new
`auth/infrastructure/skater-profile-bridge/` directory) that wraps its own existing
`ValidateSessionUseCase`/`SessionGuard` machinery, and exports the provider from `auth.module.ts`
for `skater-profile.module.ts` to import.

**Rationale**: Constitution Principle II requires cross-module dependencies to go through a port
the *consuming* module declares in its own `domain/`, never a direct import of another module's
internals. `skater-profile` needs exactly the same "is there a valid session, and for which
account/role" answer that `auth`'s `SessionGuard` already computes on every request — duplicating
that logic (re-parsing the cookie, re-implementing `ValidateSessionUseCase`) would violate
Principle II even harder (two sources of truth for session validity). The port pattern lets
`auth` keep owning session logic exclusively while `skater-profile` depends only on an
abstraction it controls.

**Alternatives considered**:
- *Direct import of `auth`'s `SessionGuard`/`ValidateSessionUseCase`*: rejected — explicitly
  forbidden by Constitution II (no cross-module import of another module's
  domain/application/infrastructure files).
- *Re-implement session/cookie validation inside `skater-profile`*: rejected — duplicates
  security-critical logic (cookie parsing, session-store lookup, expiry/revocation checks)
  already correct and tested in `auth`; a second implementation is a drift risk, not a
  decoupling win.
- *Move session validation into `src/shared/`*: rejected — session validation is not
  "no-single-owner" infrastructure like app config or the Prisma client; it is `auth`'s core
  business logic (FR-014/FR-016 of 001 depend on it), so it stays owned by `auth` and exposed
  only through the port.

## 3. Where the onboarding gate is enforced: at login vs. at the MainApp entry point

**Decision**: The gate is a client-side check on `/` (MainApp), not on `/login`.
`MainAppPlaceholder.tsx` already performs its own `GET /auth/session` check on mount and
redirects to `/login` when unauthenticated — that same check is extended (not duplicated in a
new component) so that, only when `authenticated && role === "skater"`, it also calls
`GET /skater-profile/me`; if the profile is incomplete, it redirects to `/onboarding` instead of
rendering the placeholder content.

**Rationale**: FR-002 requires the gate on *every* login, and the Edge Cases require it to also
catch direct/bookmarked navigation straight to `/` and a second tab catching up after another tab
completes onboarding. Checking only right after `POST /auth/login` (or the Google callback) would
miss both of those — a skater with an already-valid session cookie who navigates straight to `/`
would never see the check. A single choke point at the MainApp entry point covers every path into
the MainApp uniformly, new session or existing one, with one guard instead of duplicating the
check at every login entry point (credentials, Google callback, direct navigation).

**Alternatives considered**:
- *Check at `POST /auth/login` success and the Google callback only*: rejected — does not cover
  direct navigation to `/` with an existing session, which the Edge Cases explicitly call out.
- *Server-side redirect (Astro middleware/SSR)*: rejected — `astro.config.mjs` fixes
  `output: "static"` (Constitution/001 precedent), served by a plain static file server with no
  per-request server logic; the same reasoning already applied to 001's FR-018 applies here.

## 4. Birth-date validation range

**Decision**: Reject a `fechaDeNacimiento` that is in the future, or that would place the
skater's age outside a generous sanity bound (not below 5, not above 100 years), on both the
client and the server. No minimum-admission-age policy is enforced beyond this sanity check (per
spec.md's Assumptions).

**Rationale**: FR-005 only requires "not future, realistic age" without pinning exact numbers,
and spec.md's Assumptions explicitly defers any real minimum-age/consent policy to a future,
separate decision. A wide sanity bound catches obvious data-entry mistakes (typos producing an
implausible age) without encoding a business policy this spec was never asked to define.

**Alternatives considered**: No validation beyond "not a future date" — rejected: leaves
obviously-wrong ages (e.g., a 200-year-old skater from a typo'd year) silently accepted, which
SC-002-style profile-correctness expectations (borrowed from 002) argue against.
