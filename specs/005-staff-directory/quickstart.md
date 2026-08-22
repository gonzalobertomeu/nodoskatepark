# Quickstart: Validating Listado de Staff

Manual/scripted validation scenarios proving the feature works end-to-end. Assumes
001-user-login-sso and 003-instructor-role-assignment are already implemented and running — this
feature needs at least one `instructor` and one `administrador` account to list.

## Prerequisites

- Bun installed; the same running PostgreSQL instance used by 001/002/003/004.
- `bun install` run at the repo root.
- At least one `administrador` account (seeded directly in the DB, same precedent as
  002/003's own quickstarts — no self-service admin signup exists).
- At least one `instructor` account, and ideally one whose `nombre`/`apellido` were never set
  (promoted or invited without ever completing 004's skater onboarding), to exercise the
  "perfil incompleto" case.

## Setup

```bash
bun run --cwd apps/backend --bun prisma migrate deploy --schema prisma/schema.prisma
bun nx serve backend   # http://localhost:3000
bun nx serve frontend  # http://localhost:4321
```

## Scenario 1 — View the full staff listing (User Story 1, SC-001, SC-002, SC-003)

1. Log in as `administrador`, open the staff listing page.
2. **Expect**: `GET /staff-directory` returns `200`, and every seeded `instructor`/
   `administrador` account appears with nombre, apellido, email, and role (SC-002).
3. **Expect**: no seeded `skater` account appears anywhere in the response (SC-003).

## Scenario 2 — Incomplete-profile staff account (User Story 1, Acceptance Scenario 3)

1. Ensure at least one listed staff account has no `nombre`/`apellido` set.
2. **Expect**: that account's row shows "perfil incompleto" — never a blank name field.

## Scenario 3 — Deactivated staff account still listed (User Story 1, Acceptance Scenario 4)

1. Deactivate a seeded staff account directly in the DB (`status = 'deactivated'`).
2. **Expect**: that account still appears in the listing, marked as deactivated — not hidden.

## Scenario 4 — Search narrows the listing (User Story 2, SC-001)

1. On the staff listing page, enter a search term matching one staff account's name or email.
2. **Expect**: `GET /staff-directory?q=...` returns only the matching account(s); finding a
   specific person takes under 15 seconds from opening the page (SC-001).
3. Enter a search term matching no staff account.
4. **Expect**: an empty-state message, not a blank list with no explanation.

## Scenario 5 — Pending instructor invitations are not listed (Edge Cases, FR-009)

1. Create a pending instructor invitation via 003 (`POST /instructor-assignment/invite`) for an
   email with no account yet.
2. **Expect**: that email does **not** appear anywhere in `GET /staff-directory` — it has no
   `Account` row yet.

## Scenario 6 — Access control (FR-007, SC-004 equivalent)

1. Log in as a `skater` account, attempt `GET /staff-directory` directly.
2. **Expect**: `403 forbidden`.
3. Repeat as an `instructor` account (staff, but not administrador).
4. **Expect**: still `403 forbidden` — this feature is `administrador`-only, stricter than 002's
   staff-wide access (research.md #4).

## Success criteria checklist

- [X] SC-001 — find a specific staff member (by name or email) in under 15 seconds (Scenario 4)
- [X] SC-002 — 100% of `instructor`/`administrador` accounts appear in the listing (Scenario 1)
- [X] SC-003 — 0% of `skater` accounts ever appear in the listing (Scenario 1)
- [X] SC-004 — 100% of staff accounts with no `nombre`/`apellido` show "perfil incompleto",
      never a blank field (Scenario 2)

All 6 scenarios validated live on 2026-08-22 via Docker Compose (curl for the API, Claude in
Chrome for the `/staff` UI, including interactive search and the "no se encontraron resultados"
empty state).
