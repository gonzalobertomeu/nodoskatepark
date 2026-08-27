# Implementation Plan: Navegación Principal por Barra Inferior según Rol

**Branch**: `006-role-based-bottom-nav` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-role-based-bottom-nav/spec.md`

## Summary

Dar al entorno autenticado un caparazón de aplicación con una barra de navegación inferior fija
cuyo conjunto de destinos deriva del rol de la cuenta: tres para skater (Reservar clases, Mi
perfil, Configuración), tres para administrador (Skaters, Staff, Horarios de clases) y dos para
instructor (Skaters, Horarios de clases). Hoy no existe navegación alguna: `apps/frontend` es una
MPA estática de doce páginas `.astro` sueltas, sin caparazón, donde cada enlace provoca una recarga
completa de documento — exactamente lo que el seguimiento diferido del Principio IX identificó
como una funcionalidad de caparazón por derecho propio.

El enfoque técnico, resuelto en [research.md](./research.md): conservar `output: 'static'` y montar
un **caparazón React único** que posee la navegación. Astro prerenderiza una página por cada una de
las ocho rutas direccionables — todas montan el mismo `AppShell` — de modo que la entrada directa a
cualquier dirección funciona (FR-020a), y a partir de la hidratación todo cambio de destino ocurre
en el cliente con la History API, sin recarga (FR-020). Los destinos ya visitados quedan **montados
y ocultos**, cada uno en su propio contenedor de desplazamiento: eso conserva su estado y su
posición sin contabilidad manual (FR-019) y hace que volver a uno sea un cambio de clase CSS, que
es lo que sostiene el techo de 100 ms (FR-020c). No se agrega ninguna dependencia y el único cambio
en el servidor es un campo `email` sumado al contrato de sesión ya existente.

## Technical Context

**Language/Version**: TypeScript 5.7 sobre Bun (Principio I)

**Primary Dependencies**: Astro 4.16 (`output: 'static'`), React 18.3, Zod 3.25,
`@nodoskatepark/contracts` (workspace). Backend: NestJS. **Ninguna dependencia nueva.**

**Storage**: N/A — esta funcionalidad no persiste nada ni cambia el esquema de base de datos.

**Testing**: `bun test` con `@testing-library/react` y `happy-dom`, ya declarados en
`apps/frontend/package.json` y precargados por `apps/frontend/bunfig.toml`. Serían las primeras
pruebas del repositorio: hoy no existe ningún `*.test.ts(x)`.

**Target Platform**: navegadores móviles primero, iOS Safari como referencia; desde 320 px de ancho
hacia arriba, con presentación de riel lateral a partir de 1024 px.

**Project Type**: aplicación web en monorepo Nx — frontend Astro/React y backend NestJS, cada uno
en su contenedor, con `packages/contracts/` como fuente de verdad compartida.

**Performance Goals**: FR-020c — destino ya visitado en ≤100 ms; primera visita con respuesta
visible en ≤100 ms y datos reales en ≤1 s. Sin montar destinos por adelantado al ingresar.

**Constraints**: sin recarga completa de documento entre destinos; sin sondeo ni canal empujado
para el cambio de rol; sin dependencias nuevas; `output: 'static'` se conserva (no se introduce
SSR ni adaptador de servidor); solo colores de `tokens.css`.

**Scale/Scope**: 3 roles, 6 destinos (2 de ellos en preparación), 2 superficies anidadas, 8 rutas
direccionables. Un cambio de contrato, tres archivos de backend tocados, cinco páginas `.astro`
existentes reemplazadas por el caparazón.

## Constitution Check

*GATE: comprobado antes de Phase 0 y revalidado tras Phase 1. Resultado: **sin violaciones**.*

| Principio | Gate | Estado |
|---|---|---|
| I. Bun-First | No se introduce paso de compilación previo; sigue `astro dev` ejecutando TS directo. | PASS |
| II. Module-First Clean Architecture | El cambio de backend queda dentro de `modules/auth/` (`application/` e `infrastructure/`). `domain/` no se toca: `Account.email` ya existe. Sin tipos de framework en `domain/`. | PASS |
| III. Contracts as Source of Truth | El único cambio de forma de datos se define primero en `packages/contracts/src/auth/session.contract.ts`; backend y frontend lo consumen desde ahí. Sin endpoints ad-hoc. Ver [contracts/session-endpoints.md](./contracts/session-endpoints.md). | PASS |
| IV. Contenedores y Compose | Sin servicios nuevos, sin cambios de Dockerfile ni de compose; todo se ejecuta con `bun run up`. | PASS |
| V. Nx + Biome | Sin dependencias nuevas, sin herramientas de lint nuevas. Los objetivos `test` y `lint` de `apps/frontend/project.json` ya existen. | PASS |
| VI. Neobrutalismo y paleta | `app-shell.css` usa exclusivamente las variables de `tokens.css`; bordes sólidos y sombras duras, sin degradados ni desenfoques. Ningún color nuevo. | PASS |
| VII. Lenguaje de roles | Se usan `skater`, `instructor`, `administrador` y "staff" como colectivo, en código y en etiquetas. | PASS |
| VIII. Resend | Intacto. "Cambiar contraseña" reutiliza el flujo de recuperación existente, ya detrás del puerto `EmailSender`. | PASS |
| IX. UX-First, Native-Feel Navigation | Esta funcionalidad **es** el trabajo de cumplimiento del principio: barra inferior persistente como navegación única, 2–5 destinos con icono y etiqueta, cambio de destino con estado conservado y sin recarga, objetivos táctiles de 44×44 px, techo de tres toques verificado en [data-model.md §3](./data-model.md), riel en escritorio con idéntica arquitectura de información. Cierra el seguimiento diferido del informe de impacto de la v2.2.0. | PASS |

**Revalidación tras Phase 1**: el diseño no introdujo ninguna desviación. El punto que más cerca
estuvo de una fue el email de la cuenta: se resolvió extendiendo el contrato de sesión vigente en
lugar de crear un endpoint nuevo, que es la lectura estricta del Principio III (research.md §4).

## Project Structure

### Documentation (this feature)

```text
specs/006-role-based-bottom-nav/
├── plan.md                        # Este archivo
├── spec.md
├── research.md                    # Phase 0 — 11 decisiones técnicas resueltas
├── data-model.md                  # Phase 1 — entidades del caparazón y mapa de destinos
├── quickstart.md                  # Phase 1 — 16 escenarios de validación
├── contracts/
│   ├── session-endpoints.md       # Delta de GET /auth/session (+ email)
│   └── navigation-map.md          # Contrato de UI: rutas, historial, estados
├── checklists/
│   └── requirements.md
└── tasks.md                       # Phase 2 — lo crea /speckit-tasks
```

### Source Code (repository root)

```text
packages/contracts/src/auth/
└── session.contract.ts                      # MOD: `email` en la rama autenticada

apps/backend/src/modules/auth/
├── application/use-cases/validate-session.use-case.ts   # MOD: ValidatedSession gana email
└── infrastructure/http/
    ├── session.guard.ts                     # MOD: AuthenticatedRequest.session gana email
    └── auth.controller.ts                   # MOD: getSession devuelve email

apps/frontend/src/
├── app/                                     # NUEVO — lógica del caparazón
│   ├── navigation-map.ts                    # Destination, RoleDestinations, NestedSurface
│   ├── router.ts                            # Router propio sobre History API
│   └── session-context.tsx                  # Sesión, rol, email, revalidación
├── components/app-shell/                    # NUEVO — piezas del caparazón
│   ├── AppShell.tsx                         # Orquestador: sesión, guardas, enrutado
│   ├── BottomNav.tsx                        # Barra / riel; nav + aria-current
│   ├── DestinationHost.tsx                  # Paneles vivos, uno por destino visitado
│   ├── SectionHeader.tsx                    # h1 enfocables + flecha de volver + cuenta
│   ├── AccountMenu.tsx                      # Elemento de cuenta del staff (FR-016, FR-017)
│   ├── SectionInPreparation.tsx             # FR-025, FR-026
│   └── SectionError.tsx                     # FR-024a, FR-024b
├── components/
│   └── SettingsView.tsx                     # NUEVO — destino Configuración del skater
├── layouts/
│   └── AppLayout.astro                      # NUEVO — documento del entorno autenticado
├── pages/
│   ├── index.astro                          # MOD: monta AppShell en lugar del placeholder
│   ├── [...appRoute].astro                  # NUEVO: prerenderiza las 7 rutas restantes
│   ├── profile.astro                        # BORRA — la sirve el caparazón
│   ├── staff.astro                          # BORRA
│   ├── instructors.astro                    # BORRA (se mueve a /staff/instructors)
│   └── skaters/{index,profile}.astro         # BORRA
├── styles/
│   └── app-shell.css                        # NUEVO — barra, riel, paneles, áreas seguras
└── components/MainAppPlaceholder.tsx        # BORRA — lo sustituye AppShell

apps/frontend/test/                          # NUEVO — primeras pruebas del repositorio
├── navigation-map.test.ts                   # Conjuntos por rol, etiquetas, límites 2–5
├── app-shell.test.tsx                       # Aterrizaje, guardas, cambio de rol
├── destination-host.test.tsx                # Paneles vivos, estado conservado
└── bottom-nav.test.tsx                      # aria-current, teclado, etiquetas literales
```

**Structure Decision**: se mantiene la estructura de monorepo ya establecida — `apps/backend`,
`apps/frontend`, `packages/contracts` — sin agregar apps ni paquetes. Dentro de `apps/frontend` se
introducen dos directorios nuevos que hoy no tienen equivalente: `src/app/` para la lógica del
caparazón (mapa, router, sesión), separada de la presentación, y `src/components/app-shell/` para
sus componentes. El resto de `src/components/` conserva las vistas ya existentes sin modificarlas:
`SkaterListView`, `StaffListView`, `SkaterProfileView`, `InstructorAssignmentView` y
`SkaterBasicInfoForm` se adoptan tal cual y pasan a montarse dentro de los paneles del caparazón en
lugar de dentro de una página `.astro` propia.

## Phase 0 — Outline & Research

Completado: [research.md](./research.md). Once decisiones, todas con alternativas descartadas y su
motivo. Las de mayor consecuencia:

1. **Caparazón React único sobre Astro estático** — descarta `<ViewTransitions />` (re-monta las
   islas y pierde el estado, incompatible con FR-019) y descarta pasar a `output: 'server'`.
2. **Router propio de ~80 líneas** — un router convencional desmonta la ruta anterior, que es justo
   lo contrario de lo que FR-019 pide, y la semántica `replaceState`/`pushState` de FR-022b hay que
   escribirla explícitamente en cualquier caso.
3. **Paneles vivos con contenedor de desplazamiento propio** — conserva estado y `scrollTop` sin
   guardar ni restaurar nada.
4. **`email` en el contrato de sesión** — el dato ya está cargado en `ValidateSessionUseCase`.
5. **"Cambiar contraseña" reutiliza el flujo de recuperación** — sin superficie de credenciales nueva.
6. **Revalidación del rol en cada cambio de destino**, nunca por temporizador (FR-014).

Sin ningún NEEDS CLARIFICATION pendiente.

## Phase 1 — Design & Contracts

Completado:

- **[data-model.md](./data-model.md)** — `Destination`, `RoleDestinations` (la tabla completa de
  rol → destinos, con etiquetas literales y rutas), `NestedSurface`, `SessionState` con su tabla de
  transiciones, y `DestinationViewState`. Incluye la verificación de que los caminos más largos
  quedan en dos toques, por debajo del techo de tres (FR-021, SC-001).
- **[contracts/session-endpoints.md](./contracts/session-endpoints.md)** — el delta del contrato,
  su cadena de propagación en el servidor y la lista de endpoints reutilizados sin modificar.
- **[contracts/navigation-map.md](./contracts/navigation-map.md)** — el contrato de UI: las ocho
  rutas, la semántica de historial, los cuatro estados que todo destino debe saber presentar, y
  cómo aloja su superficie una funcionalidad futura.
- **[quickstart.md](./quickstart.md)** — dieciséis escenarios de validación con su requisito
  asociado, incluida la forma de medir el techo de 100 ms y de comprobar que el rechazo de acceso
  sigue siendo del servidor.

## Riesgos y puntos de atención

| Riesgo | Mitigación |
|---|---|
| Borrar cinco páginas `.astro` cambia rutas en uso (`/instructors` → `/staff/instructors`). | Nada externo enlaza esas rutas; los enlaces internos se reescriben en el mismo cambio. Verificado con el escenario 5 de quickstart. |
| Contrato y backend desfasados dejarían el frontend sin poder parsear la sesión. | Contrato, backend y frontend en el mismo PR, según el Development Workflow de la constitución. |
| El prerender estático de las ocho rutas depende de que la ruta comodín no eclipse las páginas no autenticadas. | Astro prioriza rutas estáticas sobre rutas `rest`; `getStaticPaths` emite únicamente las siete rutas enumeradas, y `/` lo sigue sirviendo `index.astro`. Cubierto por el escenario 8. |
| Las vistas adoptadas gestionan hoy su propio error de carga; ahora deben respetar FR-024a/FR-024b. | Se adoptan sin modificar su lógica de datos; el caparazón aporta el envoltorio de error con reintento. La distinción respecto de "sección en preparación" se comprueba en el escenario 12. |

## Complexity Tracking

Sin violaciones de la constitución que justificar. Esta sección queda intencionalmente vacía.
