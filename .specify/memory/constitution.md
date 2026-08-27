<!--
Sync Impact Report
- Version change: 2.1.0 → 2.2.0
- Modified principles: none redefined. Principle VI (Neobrutalist Design System & Brand Palette)
  is now explicitly complemented by Principle IX: VI continues to govern how the product looks,
  IX governs how it navigates and behaves; a UI-bearing change must satisfy both.
- Added principles:
  - IX. UX-First, Native-Feel Navigation — the authenticated application MUST present as a native
    iOS app rather than a website: a persistent bottom tab bar (icon + label, 2-5 destinations)
    as the sole primary navigation, no hamburger/drawer or link-list landing pages, state-
    preserving tab switching with no full document reloads, native-feeling modal/sheet/push
    presentations, touch-first affordances (44x44 px minimum targets, no hover-only controls),
    a hard ceiling of three taps from any tab root to any primary action, content-first
    expressive layouts, and mobile-first responsiveness from 320 px upward with one identical
    information architecture at every breakpoint. UX wins over implementation convenience when
    the two conflict.
- Added sections: none (Technology Stack, Development Workflow, and the Governance compliance
  review each gained one entry cross-referencing the new principle)
- Removed sections: none
- Templates requiring follow-up: none — this command only updates the constitution itself.
- Deferred placeholders: none.
- Resolved from v2.1.0: the SMTP `EmailSender` adapter flagged as out of compliance with
  Principle VIII has since been replaced by `resend-email-sender.ts`; that follow-up is closed.
- Deferred non-governance follow-up: the existing frontend cannot satisfy Principle IX as built.
  `apps/frontend` is a static Astro MPA (`output: 'static'`) of twelve discrete `.astro` pages
  with a single `AuthLayout.astro`, no application shell, no navigation component, and no client
  router or view transitions — so there is no persistent bottom tab bar, and every in-app
  navigation is a full document reload that discards tab state. Bringing the app into compliance
  is a frontend-shell feature in its own right. See Next Actions in the command output.
-->

# NodoSkatepark Constitution

NodoSkatepark is a membership and operations management system for a skatepark that offers
both instructor-led classes and free/open skate sessions (pistas libres, without a class).
The system is built as a Bun-based Nx monorepo with an Astro + React (TypeScript) frontend and
a NestJS backend, each sub-app shipped in its own container.

## Core Principles

### I. Bun-First Runtime & Tooling
Bun MUST be the default JavaScript/TypeScript runtime and package manager across the entire
monorepo — backend, frontend, scripts, and tooling — wherever Bun support exists. A dependency
or tool that cannot run under Bun MAY be used instead, but the exception and the reason it was
necessary MUST be documented (e.g., in the relevant app's README or an ADR). In local/dev
execution, TypeScript MUST run directly — Bun executing `.ts` sources natively for the backend,
and each frontend's own dev server (e.g., Astro's) doing the same — with no ahead-of-time
compilation step (no `tsc`, no `nest build`, no checked-in `dist/` being what actually runs)
standing between edited source and the running process. Codegen that isn't compiling the
project's own TypeScript (e.g., Prisma Client generation) is not affected by this rule.
Rationale: a single runtime/package-manager avoids divergent lockfiles, inconsistent scripts,
and "works on one app, not the other" failures across a multi-app monorepo. Running TypeScript
directly in dev also collapses the "works on my build, not on theirs" class of bugs, since there
is no intermediate compiled artifact that can drift from source.

### II. Module-First Clean Architecture Layering
Every service — most notably the NestJS backend — MUST be organized module-first: each bounded
context (e.g. `auth`, and any future one) lives under its own directory at
`src/modules/<module-name>/`, and the Clean Architecture split applies inside that directory —
`src/modules/<module-name>/domain/`, `.../application/`, `.../infrastructure/` — never as a
single flat `domain/`/`application/`/`infrastructure/` split spanning the whole service. Within
a module: the `domain/` layer (entities, value objects, business rules) MUST NOT import from
that module's `application/` or `infrastructure/`; the `application/` layer (use
cases/orchestration) MUST depend only on abstractions defined in that module's `domain/`; the
`infrastructure/` layer (database, HTTP controllers, external services, framework wiring)
implements those abstractions and MAY depend on both. Framework types (NestJS decorators, ORM
entities, HTTP DTOs) MUST NOT leak into any module's `domain/`. Cross-cutting infrastructure
owned by no single module (e.g. app-wide configuration, a shared database client) MAY live
outside `src/modules/`, in a top-level `src/shared/`, and MUST be exposed to modules only
through its own NestJS module — never by one module reaching into another module's, or into
`src/shared/`'s, internal files.

Modules MUST be as decoupled as possible. A module MUST NOT import another module's `domain/`,
`application/`, or `infrastructure/` files directly. The only way module A may depend on
behavior owned by module B is through a port — an abstract class, per the DI-token rule below —
that A declares in its own `domain/` describing what it needs; B's implementation of that port
is registered and injected via NestJS DI exactly like any other domain/infrastructure port.
Nothing in how A calls that port may depend on B being an in-process module rather than a
remote service.

Backend abstractions defined in a module's `domain/` (repositories, external-service ports,
cross-module ports, and any other boundary an `infrastructure/` implementation or another
module fulfills) MUST be declared as `abstract class`, never as a TypeScript `interface`. Each
such abstract class MUST double as its own dependency-injection token: NestJS providers MUST
register implementations against the abstract class itself (e.g.
`{ provide: AccountRepository, useClass: PrismaAccountRepository }`), and consumers MUST inject
by referencing that same class — never by exporting and injecting a separate `Symbol()` or
string token alongside the abstraction. Plain data shapes with no injected implementation (DTOs,
use-case input/output types) are unaffected and MAY remain `interface`s or `type`s.
Rationale: keeps the skatepark's business rules independently testable and portable across
framework or infrastructure changes, instead of being entangled with NestJS or a specific ORM.
Organizing module-first — layering applied once per bounded context instead of once for the
whole service — keeps each module independently comprehensible and, combined with the
port-only rule for cross-module calls, means any module's boundary to the rest of the monolith
could later be swapped for a network client — extracting that module into its own microservice
— without changing that module's own domain/application code. Declaring domain abstractions as
abstract classes — rather than interfaces paired with a separate `Symbol()` token — keeps the
abstraction and its injection token as a single artifact: a TypeScript `interface` is erased at
compile time and cannot itself serve as a runtime DI token, so pairing one with an ad-hoc
`Symbol()` risks the two drifting out of sync (a renamed interface whose token string/name isn't
updated to match), while an abstract class is usable natively as both the compile-time type and
the runtime token.

### III. Contracts as Source of Truth
Every backend endpoint MUST be defined first as a contract in the shared `packages/contracts/`
package before it is implemented. A contract declares the endpoint's abstraction — route,
request shape, response shape, and error cases — as shared, typed code. The NestJS backend
MUST implement each endpoint against its contract, and the Astro/React frontend MUST consume
each endpoint through the same contract. Manually duplicated request/response types, or
ad-hoc endpoints with no corresponding contract, are NOT permitted.
Rationale: guarantees backend and frontend cannot silently drift apart, and gives every other
consumer (future services) one typed definition of how an endpoint must be implemented and
consumed.

### IV. Isolated, Containerized Sub-Apps & Compose-Only Orchestration
Each sub-app (frontend, backend, and any future service) MUST ship with its own Dockerfile and
be independently buildable and runnable in its own container. A sub-app MUST NOT import source
files directly from another sub-app; cross-app reuse MUST flow only through `packages/`
(shared libraries, including `packages/contracts/`) or through the network/API contract
boundary between running services.

Docker Compose MUST be the sole way to run the project locally: nothing runs directly on the
host (no bare `bun nx serve`, no bare `nest start`, no bare `astro dev`/`bun install` outside a
container). Each sub-app MUST own its own `compose.yaml` alongside its Dockerfile. Infra
services that are not application code (databases, caches, message brokers, and anything else
non-application-specific) MUST live in a single root-level `compose.infra.yaml`, never inside a
sub-app's own compose file. A root-level `compose.yaml` MUST include every sub-app's compose
file and `compose.infra.yaml` so the whole stack comes up as one unit.

Dev containers MUST bind-mount their sub-app's source tree from the host so edits are picked up
live (watch/hot-reload mode). `node_modules` MUST NOT be part of that bind mount at any level —
the root workspace `node_modules` and every sub-app's/package's own `node_modules` MUST instead
be isolated as internal named Docker volumes, so the host's and the container's dependency
trees (which may differ by OS/architecture, or simply not exist on the host at all) never
collide or overwrite one another.
Rationale: preserves independent deployability and scaling per app, and prevents the
container/app boundary from being quietly bypassed by filesystem-level coupling. Requiring
Compose for all local execution keeps "how do I run this" to one command regardless of app,
keeps infra concerns (Postgres today, more later) out of application sub-apps' own compose
definitions, and keeps environments reproducible across contributors' machines instead of
depending on whatever happens to be installed on the host. Isolating `node_modules` into named
volumes is what makes source bind-mounts safe: without it, a host install (or no install at
all) would shadow the container's own Linux-built dependency tree and break the container.

### V. Monorepo Tooling Consistency (Nx + Biome)
Nx MUST be used to manage the project graph and to run build, test, and lint tasks across all
apps and packages. Biome (version 2.x, currently 2.5, or newer within that major line) MUST be
the sole linter and formatter for the monorepo. ESLint (and any other competing linter or
formatter, e.g. Prettier) MUST NOT appear anywhere in the repo — no config file, no dependency,
no per-app exception — including configs a scaffolding tool (e.g. a framework CLI generator)
may add by default; any such generated config MUST be removed or migrated to Biome as part of
the same change that introduces it.
Rationale: one project-graph tool and one lint/format tool keep CI, editor tooling, and
onboarding predictable across many small containerized apps and packages. Naming a version
floor keeps the whole monorepo on one Biome major line instead of drifting per app, and treating
scaffolder-generated ESLint configs as a bug to fix (not a tolerated exception) is what actually
keeps Biome the sole tool in practice.

### VI. Neobrutalist Design System & Brand Palette
All user-facing frontend surfaces MUST use the neobrutalism visual style (as exemplified by
neobrutalism.dev) as the default UI language: solid flat color fills, thick solid borders, hard
offset drop-shadows (no soft/blurred shadows, no gradients), and high-contrast, clearly visible
interactive states — no attempt to soften the look into a generic, low-contrast SaaS aesthetic.
The color palette MUST be restricted to the brand system taken from the production landing page
(nodoskatepark.com): black (`#000000`), white (`#ffffff`), a grayscale set (dark gray
`#292828`/`#343333`, light gray/off-white `#f5f3ef`/`#fefefe`), and yellow (`#ece315`/`#ebe212`)
as the single primary accent, reserved for primary actions, highlights, and emphasis. Any color
outside this palette (e.g., a semantic error/success color) MUST be justified and added to a
shared design-token definition rather than introduced ad hoc inside a single component.
Rationale: a skatepark community product benefits from a bold, high-energy, unmistakably "skate"
visual identity, and neobrutalism's raw, high-contrast style delivers that distinctly. Pinning
the palette to the existing landing page keeps the marketing site and the MainApp reading as one
consistent brand instead of drifting apart visually over time.

### VII. Ubiquitous Role Language: Skater, Instructor, Administrador, Staff
The product domain defines exactly three account roles, mutually exclusive: every account MUST
have exactly one of them at any time.
- **Skater**: the standard membership role — the person who attends free-skate sessions or
  classes at the skatepark. It is the default role for any account created through
  self-registration.
- **Instructor**: a staff role that teaches classes and supervises free-skate sessions; requires
  operational visibility into skaters (e.g., their declared health conditions) to act safely.
- **Administrador**: the higher-ranking staff role; holds every instructor permission plus
  exclusive management capabilities (e.g., granting the instructor role to other accounts, and
  any further administrative capability defined by future features).

**"Staff"** is not a fourth role — it is the collective term for instructor and administrador.
Both share access to the same administration application, differing only in their permission
level within it. A skater account MUST NEVER have access to that application.

"Miembro" is the Spanish word for "member" and is a synonym of "Skater" — the two refer to the
same role. "Skater" is the canonical term: new code, specs, and technical/UI labels MUST use
"skater", while "miembro"/"member" MAY still appear in natural-language Spanish copy (e.g., user
communication, legal/membership documents) as its plain-language equivalent.
Rationale: this glossary is transversal to every feature in the product (login, skater
management, role assignment, and whatever follows). Fixing one ubiquitous language prevents the
data model, UI, and specs from drifting into different names for the same concept, and because
"staff" access covers sensitive data (declared health conditions) and a shared administration
application, precision about who each role is has a direct security and access-control impact.

### VIII. Resend as the Sole Email Delivery Provider
Resend (resend.com) MUST be the only email delivery provider integrated anywhere in the
monorepo. It MUST be used for every category of outbound transactional email the product sends,
including at minimum: user notifications, account/email verification, and password-reset
delivery. No other email service, SDK, or raw SMTP relay MAY be introduced without a further
amendment to this constitution. The integration MUST stay confined to an `infrastructure/email/`
adapter behind the domain-defined `EmailSender` port (per Principle II) — `domain/` and
`application/` code MUST NOT reference Resend, or any Resend-specific type, directly; they MUST
depend only on the port.
Rationale: standardizing on a single provider avoids maintaining parallel SMTP/API integrations
for the same category of outbound email across the product, and keeping Resend behind the
existing `EmailSender` port means the specific provider can still be swapped or mocked in tests
without touching business logic — this principle pins *which* provider is authorized
project-wide; Principle II already governs *how* any such adapter must be wired.

### IX. UX-First, Native-Feel Navigation
UX is a first-class constraint on every user-facing surface, not a finishing pass: where UX
quality and implementation convenience conflict, the conflict MUST be resolved in favor of UX,
and the added implementation cost is accepted rather than traded away.

The authenticated application — both the skater MainApp and the staff administration app — MUST
present itself as a native iOS application, not as a website:

- **Bottom tab bar as the primary navigation.** Every authenticated surface MUST be reachable
  from a persistent bottom tab bar, each destination carrying an icon plus a text label. The bar
  MUST stay visible and fixed while navigating within a tab. A top navigation bar, a
  hamburger/drawer menu, or a landing page that is merely a list of links MUST NOT serve as the
  primary navigation mechanism. Top-level destinations MUST number between 2 and 5; needing a
  sixth is a signal to restructure the information architecture, never to add an overflow menu.
- **Navigation preserves state.** Switching to another tab and back MUST restore the previous
  tab's scroll position and view state. In-app navigation MUST NOT cause a full document reload —
  no white flash, no visible re-mount of the application shell between screens.
- **Native interaction patterns.** Secondary and contextual flows MUST use native-feeling
  presentations — modal sheets, in-place expansion, or push transitions with a back affordance —
  rather than plain page swaps. Touch is the primary input: every interactive target MUST be at
  least 44x44 CSS px, no affordance may be reachable only via `:hover`, and the visible
  interactive states Principle VI requires MUST render on press/`:active`, not on hover alone.
  Safe-area insets MUST be respected so the tab bar clears the home indicator on notched devices.
- **Tap economy.** From any tab root, every primary action of the product MUST be reachable
  within three taps. Screens whose only content is a list of links to other screens are
  prohibited — every screen MUST carry real content. Any UI-bearing spec MUST state, for each
  surface it introduces, which tab that surface lives under and the tap path that reaches it; a
  path exceeding three taps MUST be justified in that spec or the information architecture
  reworked until it fits.
- **Expressive, content-first layouts.** Each screen MUST lead with the content or action the
  user came for — real data on first paint, not an empty dashboard of cards or a chrome-heavy
  shell wrapped around a little content. Information that fits on the current screen MUST NOT be
  pushed behind an extra detail navigation.
- **Responsive, with one information architecture.** Layouts MUST be designed mobile-first and
  MUST render without horizontal scrolling from a 320 px viewport upward. At tablet and desktop
  widths the tab bar MAY be re-presented as a side rail or column, but the destinations, their
  order, and the depth of every path MUST remain identical across breakpoints — a desktop-only
  navigation tree, or a surface reachable at one breakpoint and not another, is NOT permitted.

Rationale: this product's users are at a skatepark, on a phone, often mid-session with one hand
free — an interface that reads as a mobile website loses to one that reads as an app they already
know how to operate. Pinning the bottom tab bar, the three-tap ceiling, the touch-target floor,
and a single information architecture across breakpoints converts "good UX" from a per-feature
aesthetic opinion into a rule a reviewer can actually check, and stops each new feature from
quietly adding another layer of menu depth to the ones before it. This principle governs how the
product moves and where things live; Principle VI governs how it looks — a UI-bearing change MUST
satisfy both.

## Technology Stack

- **Runtime & package manager**: Bun (see Principle I).
- **Frontend**: Astro + React, TypeScript.
- **Backend**: NestJS, TypeScript, structured module-first per Clean Architecture, one
  `domain`/`application`/`infrastructure` split per module under `src/modules/` (see
  Principle II).
- **Monorepo orchestration**: Nx.
- **Linting & formatting**: Biome 2.x (single tool for the whole monorepo; no ESLint).
- **Shared code**: `packages/`, home to code shared between backend, frontend, and other
  services — most importantly `packages/contracts/` (see Principle III).
- **Containerization & orchestration**: Docker, one Dockerfile per sub-app, run exclusively via
  Docker Compose — one `compose.yaml` per sub-app, infra services in a root-level
  `compose.infra.yaml`, all included from a root `compose.yaml` (see Principle IV).
- **Design system**: Neobrutalism (per Principle VI); brand color tokens (black, white,
  grayscale, yellow accent) defined once as shared design tokens and consumed by the frontend.
- **Email delivery**: Resend (resend.com) — sole provider for notifications, account/email
  verification, and password-reset email, behind the `EmailSender` port (see Principle VIII).
- **Navigation & UX**: a native-iOS-feel application shell — persistent bottom tab bar (icon plus
  label, 2-5 destinations) as the sole primary navigation, state-preserving tab switching with no
  full document reloads, mobile-first responsiveness from 320 px upward, and at most three taps
  from any tab root to any primary action (see Principle IX).

## Development Workflow

- A new or changed backend endpoint MUST update `packages/contracts/` first; the NestJS
  implementation and the frontend consumption of that endpoint MUST land consistent with the
  updated contract (in the same PR, or in explicitly sequenced PRs that leave no window where
  backend and contract disagree on a merged `main`).
- Code review MUST verify that changes respect Clean Architecture boundaries within each module
  (no `domain/` → `application/`/`infrastructure/` imports, no framework types in `domain/`),
  that no module imports another module's (or `src/shared/`'s) internals directly — only its
  exported port abstractions — that domain and cross-module port abstractions are declared as
  `abstract class` (not `interface`) and injected via the class itself rather than a separate
  `Symbol()`/string token, and that the app/package boundaries from Principle IV are not
  bypassed by direct cross-app imports.
- Any UI-bearing change MUST declare, in its spec and plan, which bottom-tab destination each new
  surface lives under and the exact tap path that reaches it. Code review MUST verify the
  three-tap ceiling, the 44x44 px touch-target floor, that tab switching preserves state without
  a full document reload, and that no desktop-only navigation tree or breakpoint-exclusive
  surface was introduced (Principle IX).
- CI MUST run Biome and Nx-orchestrated build/test/lint tasks; a PR MUST NOT merge with
  failing Biome checks.
- Any change MUST be verified by running the affected sub-app(s) through Docker Compose (e.g.
  `bun run up`), never by running a sub-app directly on the host, per Principle IV.

## Governance

This constitution supersedes any conflicting practice, README instruction, or ad-hoc
convention within the monorepo. Amendments are made by editing this file and MUST include an
updated Sync Impact Report describing what changed and why.

**Versioning policy** (semantic versioning applied to this document):
- **MAJOR**: Backward-incompatible governance changes, or removal/redefinition of a principle.
- **MINOR**: A new principle or section is added, or existing guidance is materially expanded.
- **PATCH**: Clarifications, wording fixes, or other non-semantic refinements.

**Compliance review**: Pull requests and code reviews MUST verify compliance with the
principles above, in particular module-first Clean Architecture layering and port-only
cross-module dependencies (Principle II), contracts-first
endpoint changes (Principle III), Compose-only orchestration and node_modules volume isolation
(Principle IV), the single-linter rule and Biome version floor (Principle V), the neobrutalist
style and brand palette for any UI-bearing change (Principle VI), the skater/instructor/
administrador/staff role terminology for any change touching roles, permissions, or account
data (Principle VII), that Resend remains the only email provider referenced anywhere
outside its `EmailSender` adapter (Principle VIII), and the UX-first navigation rules for any
UI-bearing change — bottom tab bar as the primary navigation, the three-tap ceiling, touch-target
minimums, state-preserving tab switching, and one identical information architecture across
breakpoints (Principle IX). Any complexity or deviation that conflicts
with a principle MUST be justified in the PR description or rejected.

**Version**: 2.2.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-27
