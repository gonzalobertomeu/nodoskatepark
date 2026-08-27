# Phase 1 — Data Model: Navegación Principal por Barra Inferior según Rol

**Feature**: `006-role-based-bottom-nav` | **Date**: 2026-08-27

Esta funcionalidad **no introduce ninguna entidad persistida ni ningún cambio de esquema de base
de datos**. Sus dos entidades (spec §Key Entities) son estructuras de la aplicación, resueltas en
el cliente a partir del rol de la sesión (FR-007a). El único cambio de forma de datos en el
servidor es el campo `email` añadido a la respuesta de sesión ya existente (§4).

---

## 1. `Destination` — Destino de navegación

Ubicación: `apps/frontend/src/app/navigation-map.ts`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `'bookings' \| 'profile' \| 'settings' \| 'skaters' \| 'staff' \| 'schedule'` | Identificador estable; no se muestra. |
| `label` | `string` | Etiqueta visible. **Literal fijado por FR-002a**, no configurable. |
| `path` | `string` | Ruta raíz del destino. Única en todo el mapa. |
| `icon` | `ReactNode` | Icono del destino; la única pieza que resuelve la fase de diseño. |
| `status` | `'built' \| 'in-preparation'` | `in-preparation` hace que el destino renderice `SectionInPreparation` (FR-025). |

**Reglas de validación**
- `label` y `path` MUST ser únicos dentro del conjunto de un rol.
- Un destino `in-preparation` MUST seguir siendo navegable y MUST NOT producir error (FR-026).
- Todo destino MUST tener `icon` y `label` no vacíos (FR-002).

---

## 2. `RoleDestinations` — Conjunto de destinos por rol

Ubicación: `apps/frontend/src/app/navigation-map.ts`

Mapa `Record<AccountRole, Destination[]>`, **ordenado**: el índice 0 es el destino de aterrizaje
tras el ingreso (FR-013) y el destino al que se reemplaza una sección que dejó de estar permitida
(FR-014a).

| Rol | Orden | `id` | `label` (FR-002a) | `path` | `status` |
|---|---|---|---|---|---|
| `skater` | 1 | `bookings` | Reservar clases | `/bookings` | `in-preparation` |
| `skater` | 2 | `profile` | Mi perfil | `/profile` | `built` |
| `skater` | 3 | `settings` | Configuración | `/settings` | `built` |
| `instructor` | 1 | `skaters` | Skaters | `/skaters` | `built` |
| `instructor` | 2 | `schedule` | Horarios de clases | `/schedule` | `in-preparation` |
| `administrador` | 1 | `skaters` | Skaters | `/skaters` | `built` |
| `administrador` | 2 | `staff` | Staff | `/staff` | `built` |
| `administrador` | 3 | `schedule` | Horarios de clases | `/schedule` | `in-preparation` |

**Reglas de validación** (comprobables con pruebas)
- Cada rol MUST tener entre 2 y 5 destinos (Principio IX; FR-008/FR-009/FR-010).
- `staff` MUST aparecer únicamente en el conjunto de `administrador` (FR-010).
- Ningún destino de `skater` MUST aparecer en un conjunto de staff, ni al revés (FR-011).
- Los roles son mutuamente excluyentes: una cuenta resuelve exactamente un conjunto (Principio VII).

---

## 3. `NestedSurface` — Superficies anidadas

Ubicación: `apps/frontend/src/app/navigation-map.ts`

Superficies ya existentes que no son destinos de primer nivel (FR-022). Cada una declara bajo qué
destino vive, lo que determina qué destino se marca activo y a dónde vuelve "subir un nivel".

| `path` | Destino padre | Componente existente | Toques desde la raíz del destino |
|---|---|---|---|
| `/skaters/profile?accountId=…` | `skaters` | `SkaterProfileView` | 1 (fila del listado) |
| `/staff/instructors` | `staff` | `InstructorAssignmentView` | 1 (acción del listado) |

**Reglas**
- Abrir una superficie anidada MUST apilar historial (`pushState`); cambiar de destino MUST
  reemplazarlo (`replaceState`) — FR-022a, FR-022b.
- El destino padre MUST quedar marcado activo mientras se ve la superficie anidada (FR-020a).
- La ruta `/instructors` actual se mueve a `/staff/instructors` para que la jerarquía de la
  dirección coincida con la jerarquía de la navegación, igual que ya ocurre con
  `/skaters/profile`.

**Verificación de FR-021 / SC-001** (tres toques desde la raíz del destino):
`/staff` → "Asignar instructor" (1) → "Promover" en la fila elegida (2) = **2 toques**, dentro del
techo. `/skaters` → fila del skater (1) → "Editar" (2) = **2 toques**.

---

## 4. `SessionState` — Estado de sesión del caparazón

Ubicación: `apps/frontend/src/app/session-context.tsx`. **Es el único dato que esta funcionalidad
pide al servidor** (FR-007a).

| Campo | Tipo | Origen |
|---|---|---|
| `status` | `'checking' \| 'authenticated' \| 'unauthenticated'` | derivado |
| `role` | `AccountRole \| null` | `GET /auth/session` |
| `email` | `string \| null` | `GET /auth/session` — **campo nuevo**, ver `contracts/session-endpoints.md` |
| `onboardingComplete` | `boolean \| null` | `GET /skater-profile/me` (solo rol `skater`) |

**Transiciones de estado**

| Desde | Evento | Hacia | Efecto |
|---|---|---|---|
| `checking` | sesión válida, skater con onboarding completo | `authenticated` | dibuja la barra del rol |
| `checking` | sesión válida, skater con onboarding incompleto | — | sale a `/onboarding`; la barra NO se dibuja (FR-005) |
| `checking` | sin sesión | `unauthenticated` | sale a `/login` |
| `authenticated` | revalidación devuelve otro rol | `authenticated` | recompone la barra (FR-014) |
| `authenticated` | otro rol y la sección actual ya no está permitida | `authenticated` | reemplaza por el destino 1 del rol nuevo y explica el motivo (FR-014a) |
| `authenticated` | revalidación devuelve `authenticated: false` | `unauthenticated` | sale a `/login` (FR-024) |

La revalidación se dispara **en cada cambio de destino** y ante un fallo de autorización de un
destino. Nunca por temporizador (FR-014).

---

## 5. `DestinationViewState` — Estado vivo de cada destino

Ubicación: `apps/frontend/src/components/app-shell/DestinationHost.tsx`. No se persiste en ningún
lado: vive mientras vive el caparazón.

| Campo | Tipo | Nota |
|---|---|---|
| `mounted` | `Set<DestinationId>` | Destinos ya visitados en esta sesión de navegación; permanecen montados y ocultos (FR-019). |
| `active` | `DestinationId` | El visible; el resto lleva `display: none`. |
| `error` | `Record<DestinationId, string \| null>` | Fallo de datos del destino, mostrado dentro de él con reintento (FR-024a). |

**Reglas**
- Un destino montado MUST NOT desmontarse al dejar de estar activo — es lo que sostiene FR-019 y
  el techo de 100 ms de FR-020c.
- Una recarga completa del navegador vacía `mounted`; solo se conserva el destino que la dirección
  identifica (FR-020b).
- `error` MUST distinguirse de `status: 'in-preparation'`: son estados distintos y no se
  presentan igual (FR-024b).
