# Phase 0 Research: Listado y Perfil de Skaters para Staff

All items below were left open by the Technical Context (which fixes runtime, frameworks, and
general architecture via 001/004's precedent, but not this feature's own design choices). Each is
resolved here so Phase 1 design has no outstanding unknowns.

## 1. Photo storage: local disk vs. object storage (S3-compatible) vs. Postgres bytea

**Decision**: Local disk, inside the backend container, backed by a named Docker volume
(`skater_photos`) so uploads survive container recreation. The `accounts` table stores only a
relative path (`fotoPath`), never the image bytes. Served through a staff-gated backend `GET`
route (reusing the same session/role check as every other endpoint in this module) — never a
public/static file path, since the whole feature is staff-only (FR-012) and that must hold for
photo bytes too.

**Rationale**: At most a few thousand skaters, each with at most one photo ≤5MB (FR-013) — a few
GB ceiling, single backend instance, single skatepark. This mirrors 001's own research.md
precedent of rejecting infrastructure (there, Redis) that isn't justified at this scale: an
S3-compatible store (e.g., MinIO) would mean standing up and operating a whole new infra service
for a problem local disk already solves at this size, and Postgres `bytea` would bloat the primary
DB with binary blobs for no relational benefit.

**Alternatives considered**:
- *S3-compatible object storage (MinIO locally, S3/R2 in prod)*: rejected for now — real
  advantages (multi-instance backend, CDN, offloading bytes from app servers) only matter past
  this scale or with a horizontally-scaled backend, neither of which is a current requirement;
  revisit if the backend ever needs multiple replicas (a named Docker volume doesn't shard across
  instances).
- *Postgres `bytea`/large object*: rejected — couples binary blob storage to the primary
  relational DB's backup/replication size for no query benefit (photos are only ever fetched by
  id, never joined/filtered on).

## 2. Aggregating a staff-facing profile across modules: ports vs. a direct read model

**Decision**: `skater-directory` declares only **two** real cross-module ports in its own
`domain/ports/`, both for genuinely owned *behavior*, not shared-table data:
- `CurrentSessionResolver` — "who is logged in, what role" — implemented + exported by `auth`
  (a second, independently-declared instance of the same shape 004 already introduced for
  `skater-profile`; each consuming module owns its own port per Constitution II, so this is not
  duplication of logic, just of the thin DI wrapper). Session validity is stateful,
  security-critical logic that only `auth` should ever compute — this must go through a port.
- `LastCheckInReader` — last check-in timestamp by account id — has **no real implementation
  anywhere yet** (no check-in/access-control feature has been built). Bound, for this feature's
  scope, to a local stub inside `skater-directory` itself that always returns `null` — exactly the
  "sin ingresos registrados" state FR-008 already requires as a first-class, expected case, not an
  error. A future check-in feature can rebind this port without `skater-directory` changing.

For the *read-only display fields* owned by other modules —
`nombre`/`apellido`/`fechaDeNacimiento` (004's `skater-profile`) and `email`/`status` (001's
`auth`) — `skater-directory`'s own `SkaterDirectoryRepository` reads them **directly via the
shared Prisma client**, in the same query as its own `apodo`/`afeccionesDeSalud`/`fotoPath`
columns, for both the listing (search) and full-profile views. No port is declared for these.

**Rationale**: An earlier draft of this plan declared three read ports (`CurrentSessionResolver`,
`AccountReader`, `SkaterBasicInfoReader`) modeled strictly on 004's session-port pattern. Working
through FR-003 (search by nombre/apellido/apodo) exposed why that's the wrong shape here: those
three fields live on the *same physical row*, but are conceptually split across two other
modules' ports — a real cross-field search would mean either fetching every skater's full row
through both ports on every list request (an N+1/full-table-per-request problem this feature's
own scale assumptions don't justify), or building real search infrastructure (e.g., a
denormalized search index) that's unwarranted at "tens to a few thousand accounts." Constitution
II's port requirement governs imports of another module's `domain`/`application`/`infrastructure`
*files* — it says nothing about reading a shared table via the shared Prisma client (already
treated as cross-cutting infrastructure outside any module's own directory, per Constitution II's
own `src/shared/` carve-out). Session validity is different in kind: it's not a table read, it's
`auth`'s owned logic (cookie parsing, session-store lookup, expiry/revocation checks) — exactly
what a port exists to protect. Distinguishing "read a column on a shared table" from "invoke
another module's owned behavior" is what keeps this decision principled rather than an
inconsistent shortcut.

**Alternatives considered**:
- *Three (now four) narrow read ports, as originally drafted*: rejected after working through the
  search requirement — see above. Would still be viable for the single-profile `GET` (an O(1)
  lookup with no N+1 concern), but splitting read strategy by endpoint (ports for profile, direct
  query for listing) would be a more confusing inconsistency than reading directly in both places.
- *A single shared "SkaterAggregateReader" port instead of several*: rejected — still hits the
  same N+1/search problem as the three-port design; the port count wasn't the actual issue.
- *Reaching directly into `auth`'s/`skater-profile`'s repository or use-case classes*: rejected —
  that would be a real file-level cross-module import, exactly what Constitution II forbids;
  reading the shared Prisma client from `skater-directory`'s own repository is not that.
- *Merging this feature into the `skater-profile` module instead of a new module*: rejected —
  `skater-profile` is scoped to the skater's own self-service onboarding/edit (004); this feature
  is a distinct bounded context (staff-only directory/management, different fields, different
  access rules) that happens to read the same underlying row, not the same responsibility.
  Keeping them separate keeps `skater-profile` simple and keeps staff-only access control from
  leaking into a module skaters themselves also use.

## 3. Search/listing strategy

**Decision**: Server-side search via a `q` query parameter (matched against nombre/apellido/apodo)
and offset-based pagination (`page`/`pageSize`), returned by `GET /skater-directory`.

**Rationale**: spec.md's Assumptions already commit to "paginación o scroll estándar" at "decenas
a pocos miles de registros" — server-side keeps each response payload small and avoids shipping
the full account list to the browser on every load, at negligible added complexity over a single
`WHERE ... ILIKE` query at this scale.

**Alternatives considered**: Fetch the full list once and filter/paginate client-side — rejected:
works fine at a few hundred rows but degrades needlessly as the roster approaches the
"pocos miles" end of the documented scale, for no real simplicity win (the search box's behavior
looks identical to the user either way).

## 4. Health-condition audit trail storage (FR-014)

**Decision**: A small dedicated table, `SkaterHealthAuditLog` (skater account id, editing staff
account id, timestamp), written on every successful health-conditions update. No generic/shared
"audit log" abstraction.

**Rationale**: This is the only field in the whole product so far with an audit requirement (per
Clarifications, backend-only, no UI). A dedicated table scoped to `skater-directory`'s own
persistence is simplest and avoids designing a generic audit framework for a single field with no
second consumer yet.

**Alternatives considered**: A generic, reusable audit-log table/service — rejected as premature
generalization for a single current use; revisit if a second feature needs the same capability.

## 5. Photo upload endpoint shape

**Decision**: A dedicated `POST /skater-directory/:accountId/photo` (multipart) endpoint, separate
from `PUT /skater-directory/:accountId` (JSON body for `apodo`/`afeccionesDeSalud`).

**Rationale**: Keeps the JSON update endpoint's request/response contract simple and
Zod-validated like every other endpoint in the codebase so far, instead of mixing multipart file
handling into the same contract. A skater's edit form can still call both from a single "save"
action in the UI without the two being one HTTP request.

**Alternatives considered**: A single multipart endpoint carrying both the file and the
apodo/afecciones fields — rejected: would make the common case (editing apodo/afecciones without
touching the photo) awkward to validate and type through `packages/contracts`' existing
Zod-schema pattern.
