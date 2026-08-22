# Staff Directory Contract: List Staff

Per Constitution Principle III, this is the abstraction to be defined first as a typed contract
in `packages/contracts/src/staff-directory/` (request/response shapes + error cases as shared
TypeScript + Zod schemas), then implemented by the NestJS backend and consumed by the Astro/React
frontend through the same contract.

This endpoint requires an authenticated `administrador` session specifically (via
`staff-directory`'s own `CurrentSessionResolver` port + `StaffDirectoryAdminOnlyGuard` —
research.md #4). An `instructor` session is rejected here even though it's "staff" — FR-007 is
narrower than 002's staff-wide access, same as 003's own `AdminOnlySessionGuard`.

All responses below are described at the contract level (shape + status), not literal wire JSON.

---

## `GET /staff-directory`

List every account with role `instructor` or `administrador`, optionally filtered by a search
term (User Stories 1 and 2).

**Request**: optional query param `q: string` — matched case-insensitively as a substring against
`nombre`, `apellido`, or `email` (FR-006). Omitted or empty `q` returns the full staff listing.

**Response (200)**:
```
{
  items: Array<{
    accountId: string;
    nombre: string | null;
    apellido: string | null;
    email: string;
    role: "instructor" | "administrador";
    status: "active" | "deactivated";
  }>;
}
```
No pagination fields — every match is returned in one response (research.md #3). An empty
`items` array is a valid response (User Story 2, Acceptance Scenario 2 — no match for `q`), not
an error.

**Errors**:
- `401 unauthenticated` — no session.
- `403 forbidden` — session role isn't `administrador` (FR-007), including an `instructor`
  session.
