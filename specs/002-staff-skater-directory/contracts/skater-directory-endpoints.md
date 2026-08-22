# Skater Directory Contracts: Listing, Profile, Edit, Photo

Per Constitution Principle III, these are the abstractions to be defined first as typed contracts
in `packages/contracts/src/skater-directory/` (request/response shapes + error cases as shared
TypeScript + Zod schemas), then implemented by the NestJS backend and consumed by the Astro/React
frontend through the same contract.

Every endpoint below requires an authenticated `instructor`/`administrador` session (via
`skater-directory`'s `CurrentSessionResolver` port). None is reachable by a `skater` account,
including for their own record (FR-012).

All responses below are described at the contract level (shape + status), not literal wire JSON.

---

## `GET /skater-directory`

Listing + search (User Story 1).

**Query params**: `q?: string` (matched against nombre/apellido/apodo — FR-003),
`page?: number` (default 1), `pageSize?: number` (default, e.g., 50).

**Response (200)**:
```
{
  items: Array<{
    accountId: string;
    nombre: string | null;       // null = perfil incompleto (FR-015)
    apellido: string | null;
    apodo: string | null;
    fotoPath: string | null;     // null = placeholder (FR-006); use GET .../photo to fetch bytes
    status: "active" | "deactivated"; // deactivated accounts still listed (Edge Cases)
  }>;
  page: number;
  pageSize: number;
  total: number;
}
```

**Errors**:
- `401 unauthenticated` / `403 forbidden` — no session, or session role is `skater` (FR-012).

---

## `GET /skater-directory/:accountId`

Full profile (User Story 2).

**Response (200)**:
```
{
  accountId: string;
  nombre: string | null;             // null = perfil incompleto (FR-015)
  apellido: string | null;
  fechaDeNacimiento: string | null;  // ISO date; edad is derived client-side for display
  email: string;
  apodo: string | null;
  afeccionesDeSalud: string | null;  // null = "sin afecciones declaradas" (FR-007)
  fotoPath: string | null;           // null = placeholder (FR-006)
  ultimoIngreso: string | null;      // ISO datetime; null = "sin ingresos registrados" (FR-008) —
                                      //   always null for now (research.md #2, no check-in feature yet)
  status: "active" | "deactivated";
}
```

**Errors**:
- `401 unauthenticated` / `403 forbidden` — as above.
- `404 not_found` — `accountId` doesn't resolve to any account, or resolves to a `staff` account
  (this feature is skater-profiles-only; staff accounts have no entry here).

---

## `PUT /skater-directory/:accountId`

Edit apodo and/or afecciones de salud (User Story 3). Deliberately has **no field** for
`nombre`/`apellido`/`fechaDeNacimiento`/`email`/`ultimoIngreso` — FR-010 is enforced by the
contract's shape itself, not by the frontend hiding fields.

**Request**:
```
{
  apodo: string | null;              // null clears it
  afeccionesDeSalud: string | null;  // null clears it → "sin afecciones declaradas" (Edge Cases)
}
```

**Response (200)**: `{ status: "ok" }` — the change is immediately reflected in both the profile
and the listing (FR-011, SC-003); writing `afeccionesDeSalud` also appends one
`SkaterHealthAuditLog` row (FR-014), never returned in this response.

**Errors**:
- `401 unauthenticated` / `403 forbidden` — as above.
- `404 not_found` — as above.
- `400 invalid_input` — malformed request shape (contract only guarantees the error shape; no
  further format constraint is defined for these free-text fields).

---

## `POST /skater-directory/:accountId/photo`

Upload/replace the skater's photo (User Story 3, FR-013). `multipart/form-data`, single file
field `photo`.

**Response (200)**: `{ status: "ok"; fotoPath: string }`.

**Errors**:
- `401 unauthenticated` / `403 forbidden` / `404 not_found` — as above.
- `400 invalid_input` — file is not JPEG/PNG/WebP, or exceeds 5MB (FR-013). The previous
  `fotoPath` (if any) is left unchanged (Edge Cases).

---

## `GET /skater-directory/:accountId/photo`

Fetches the photo bytes. Staff-gated like every other endpoint here — **not** a public/static
file path (research.md #1), since FR-012's staff-only restriction must hold for photo bytes too.

**Response (200)**: the image bytes, with the appropriate `Content-Type`.

**Errors**:
- `401 unauthenticated` / `403 forbidden` — as above.
- `404 not_found` — no photo on file for this `accountId` (frontend should show the placeholder
  instead of calling this when `fotoPath` is `null`).
