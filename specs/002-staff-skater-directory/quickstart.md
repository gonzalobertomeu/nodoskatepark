# Quickstart: Validating the Staff Skater Directory

Manual/scripted validation scenarios proving the feature works end-to-end. Assumes
001-user-login-sso and 004-skater-onboarding are already implemented and running — this feature
only adds a new module that reads from both plus its own new fields.

## Prerequisites

- Bun installed; the same running PostgreSQL instance used by 001/004.
- `bun install` run at the repo root.
- At least one staff account (`instructor` or `administrador`) — created directly in the DB, per
  003-instructor-role-assignment's precedent (no self-service staff signup exists).
- At least one skater account that has completed onboarding (004) — has
  `nombre`/`apellido`/`fechaDeNacimiento` set — and at least one that hasn't, to exercise the
  "perfil incompleto" placeholder.

## Setup

```bash
bun run --cwd apps/backend --bun prisma migrate deploy --schema prisma/schema.prisma
bun nx serve backend   # http://localhost:3000
bun nx serve frontend  # http://localhost:4321
```

## Scenario 1 — Listing shows all skaters (User Story 1, SC-001)

1. Log in as staff, open `/skaters`.
2. **Expect**: every skater account appears with nombre, apellido, apodo, and a photo or explicit
   placeholder (FR-002) — including the one with an incomplete profile, showing the
   "perfil incompleto" placeholder for its missing fields (FR-015).
3. Search by a substring of one skater's nombre/apellido/apodo.
4. **Expect**: the list filters to matching skaters only (FR-003); finding + opening a profile
   takes under 15 seconds end to end (SC-001).

## Scenario 2 — Skater role is blocked (User Story 1/2, FR-012, SC-004)

1. Log in as a `skater` account, attempt to navigate to `/skaters` and to
   `/skaters/profile?accountId=<any-account-id>` directly.
2. **Expect**: access denied on both — `GET /skater-directory` and
   `GET /skater-directory/:accountId` both return `403 forbidden` for a skater session, even for
   the skater's own `accountId`.

## Scenario 3 — Full profile, including empty states (User Story 2, SC-002)

1. Open the profile of a skater with everything filled in (apodo, foto, afecciones, and — once a
   check-in feature exists — a último ingreso; until then, expect "sin ingresos registrados" for
   everyone, per research.md #2).
2. **Expect**: nombre, apellido, apodo, edad (derived from fecha de nacimiento), email, afecciones
   de salud, and foto all render correctly (FR-005).
3. Open the profile of a skater with no photo, no afecciones declaradas, and (always, for now) no
   ingresos.
4. **Expect**: explicit placeholders for each ("sin afecciones declaradas", "sin ingresos
   registrados", a visible photo placeholder) — never a blank field or a rendering error (FR-006,
   FR-007, FR-008, SC-002).

## Scenario 4 — Edit apodo and afecciones de salud (User Story 3, SC-003)

1. Open a skater's profile, change apodo and afecciones de salud, save.
2. **Expect**: `PUT /skater-directory/:accountId` returns `200`; both changes are visible on the
   profile immediately, with no manual reload (FR-011, SC-003).
3. Go back to `/skaters`.
4. **Expect**: the listing reflects the new apodo without a manual reload/re-navigation being
   required beyond returning to the page (FR-011).
5. Clear afecciones de salud entirely and save.
6. **Expect**: the profile now shows "sin afecciones declaradas" (Edge Cases).

## Scenario 5 — Read-only fields are structurally protected (User Story 3, FR-010, SC-005)

1. In the UI, confirm nombre, apellido, edad, email, and último ingreso have no edit affordance.
2. Call `PUT /skater-directory/:accountId` directly (e.g., via curl) with a body that includes
   `nombre`/`email`/etc. alongside `apodo`/`afeccionesDeSalud`.
3. **Expect**: the extra fields are silently ignored (the contract has no such fields) or
   `400 invalid_input` if strict-shape validation is enabled — either way, the stored
   nombre/apellido/fechaDeNacimiento/email are unchanged afterward, confirmed by re-fetching the
   profile (SC-005).

## Scenario 6 — Photo upload validation (FR-013, Edge Cases)

1. Upload a valid JPEG/PNG/WebP under 5MB via `POST /skater-directory/:accountId/photo`.
2. **Expect**: `200 { status: "ok", fotoPath }`; `GET /skater-directory/:accountId/photo` returns
   the image bytes; the listing/profile now show the photo instead of the placeholder.
3. Repeat with a non-image file (e.g., a `.txt`), and separately with an oversized image (>5MB).
4. **Expect**: both rejected with `400 invalid_input`, a clear reason, and the previously-uploaded
   photo (if any) still served afterward unchanged.

## Scenario 7 — Deactivated skater still listed (Edge Cases)

1. Mark a skater account `status = "deactivated"` directly in the DB (no UI for this — belongs to
   an administrative feature).
2. Open `/skaters`.
3. **Expect**: the account still appears in the listing, with its deactivated status visibly
   indicated, rather than being hidden.

## Success criteria checklist

- [X] SC-001 — find + open a profile in under 15 seconds (Scenario 1 — validated live via
      Docker Compose + a real browser session: search "Juan", open the profile, well under 15s)
- [X] SC-002 — 100% of profiles render without errors/broken fields regardless of missing data
      (Scenario 3 — validated live for a fully-filled skater and a skater missing
      nombre/apellido/fecha de nacimiento entirely; all placeholders rendered correctly, no
      broken fields)
- [X] SC-003 — an apodo/foto/afecciones edit reflects immediately, no manual reload (Scenario 4
      — validated live: edited apodo + afecciones, saw "Cambios guardados." and the new values
      in the profile with no navigation; confirmed the listing also picked up the new apodo on
      next visit, satisfying FR-011)
- [X] SC-004 — 100% of skater-role access attempts to the listing/profile are blocked (Scenario
      2 — validated via curl: a skater session gets `403 forbidden` on both
      `GET /skater-directory` and `GET /skater-directory/:accountId`, including for the
      skater's own account id)
- [X] SC-005 — 100% of attempts to edit non-enabled fields through this feature are rejected
      (Scenario 5 — validated via curl: a `PUT` body with `nombre`/`email` alongside valid
      `apodo`/`afeccionesDeSalud` silently drops the extra fields — the contract's Zod schema
      only recognizes the two enabled fields — confirmed by re-fetching the profile afterward)

## Notes from live validation

- Also validated directly: photo upload end-to-end (valid JPEG/PNG accepted, listing thumbnail
  and profile photo both render via the staff-gated `GET .../photo` route with
  `crossOrigin="use-credentials"`; a non-image file rejected with `400 invalid_input`, existing
  photo left untouched); a deactivated skater account still appears in the listing with its
  status visibly marked (Scenario 7); `SkaterHealthAuditLog` correctly appended one row per
  `afeccionesDeSalud` write with the editing staff account id (FR-014).
- One implementation correction made during planning, before any code was written: the original
  plan called for three cross-module read ports (`CurrentSessionResolver`, `AccountReader`,
  `SkaterBasicInfoReader`). Working through the search requirement (FR-003) showed that shape
  would force either an N+1 read per listing request or real search infrastructure unwarranted
  at this scale. Simplified to two ports for genuinely owned *behavior*
  (`CurrentSessionResolver`, `LastCheckInReader`) plus a direct Prisma read of the shared
  `accounts` row for display-only fields — see research.md #2 for the full rationale.
