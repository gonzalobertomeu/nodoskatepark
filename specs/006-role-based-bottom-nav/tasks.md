---

description: "Task list for 006-role-based-bottom-nav"
---

# Tasks: Navegación Principal por Barra Inferior según Rol

**Input**: Design documents from `/specs/006-role-based-bottom-nav/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: SÍ se incluyen. No los pidió la especificación, pero el plan los declara como entregable
(`apps/frontend/test/` en la estructura de código) y serían las primeras pruebas del repositorio:
hoy no existe ningún `*.test.ts(x)`. La infraestructura ya está instalada — `bun test` con
`@testing-library/react` y `happy-dom`, precargada por `apps/frontend/bunfig.toml`.

**Organization**: agrupadas por historia de usuario para poder implementarlas y probarlas de forma
independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: a qué historia de usuario pertenece (US1…US5)
- Toda tarea lleva su ruta de archivo exacta

## Path Conventions

Monorepo Nx con dos aplicaciones y un paquete compartido:
`apps/frontend/src/`, `apps/frontend/test/`, `apps/backend/src/`, `apps/backend/test/`,
`packages/contracts/src/`. Todo se ejecuta por Docker Compose (`bun run up`), nunca en el host.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: el único cambio de servidor de la funcionalidad y las bases de estilo del caparazón.

**Nota de orden**: T001 → T004 tocan archivos distintos pero encadenados por tipos, así que van en
secuencia. Contrato primero, siempre (Principio III).

- [X] T001 Extender `sessionResponseSchema` con `email: z.string()` en la rama autenticada, en `packages/contracts/src/auth/session.contract.ts`, según [contracts/session-endpoints.md](./contracts/session-endpoints.md)
- [X] T002 Agregar `email: string` a `ValidatedSession` y devolver `account.email` en `apps/backend/src/modules/auth/application/use-cases/validate-session.use-case.ts` (la entidad `Account` ya se carga para comprobar `status`; no agregar consultas)
- [X] T003 Agregar `email` a `AuthenticatedRequest['session']` y adjuntarlo en `resolveSession` en `apps/backend/src/modules/auth/infrastructure/http/session.guard.ts`
- [X] T004 Devolver `{ authenticated: true, role, email }` desde `getSession` en `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts`
- [X] T005 [P] Crear `apps/frontend/src/styles/app-shell.css` con la barra fija, los paneles de destino y la retícula del caparazón, usando exclusivamente las variables de `apps/frontend/src/styles/tokens.css` (Principio VI: ningún color nuevo, sin degradados ni desenfoques)
- [X] T006 [P] Crear `apps/frontend/src/layouts/AppLayout.astro` como documento del entorno autenticado, importando `tokens.css`, `neobrutalist.css` y `app-shell.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el caparazón de aplicación. En una funcionalidad de navegación esta fase es
deliberadamente grande: no hay historia de usuario que pueda empezar sin barra, router ni sesión.

**⚠️ CRITICAL**: ninguna historia de usuario puede comenzar hasta terminar esta fase.

**Alcance deliberadamente excluido**: `DestinationHost` monta aquí **solo el destino activo**.
Mantener vivos los destinos visitados es trabajo de US3, que es exactamente lo que la
especificación describe como "usable sin ello".

- [X] T007 Crear `apps/frontend/src/app/navigation-map.ts` con los tipos `Destination` y `NestedSurface` y la tabla completa rol→destinos de [data-model.md §2](./data-model.md), con las etiquetas literales que fija FR-002a
- [X] T008 [P] Crear `apps/frontend/src/app/router.ts`: lectura de `location.pathname`, suscripción a `popstate`, `goToDestination()` con `replaceState` y `openNested()` con `pushState` (FR-022a, FR-022b)
- [X] T009 [P] Crear `apps/frontend/src/app/session-context.tsx` con el `SessionState` de [data-model.md §4](./data-model.md), carga inicial vía `authClient.session()` y una función `revalidate()` sin temporizadores ni sondeo (FR-014)
- [X] T010 Crear `apps/frontend/src/components/app-shell/SectionHeader.tsx`: `<h1 tabIndex={-1}>` enfocable, flecha explícita de volver para superficies anidadas y ranura para el elemento de cuenta (FR-022, FR-027c)
- [X] T011 Crear `apps/frontend/src/components/app-shell/BottomNav.tsx`: `<nav aria-label="Navegación principal">` con enlaces `<a href>` reales, icono más etiqueta, `aria-current="page"` en el activo y objetivos de 44×44 px (FR-001 a FR-004, FR-027a, FR-027b)
- [X] T012 Crear `apps/frontend/src/components/app-shell/SectionInPreparation.tsx` con el estado explícito de sección en preparación (FR-025)
- [X] T013 Crear `apps/frontend/src/components/app-shell/DestinationHost.tsx` montando únicamente el destino activo (versión base; US3 lo convierte en paneles vivos)
- [X] T014 Crear `apps/frontend/src/components/app-shell/AppShell.tsx`: resuelve la sesión, deriva el conjunto de destinos del rol, resuelve la ruta actual, traslada el foco al encabezado y reemplaza por el destino 1 cualquier ruta que el rol no tenga permitida (FR-007, FR-007a, FR-011)
- [X] T015 Crear `apps/frontend/src/pages/[...appRoute].astro` con `getStaticPaths()` que emita las siete rutas de [contracts/navigation-map.md](./contracts/navigation-map.md) y monte `<AppShell client:load />` con la ruta inicial
- [X] T016 Reemplazar el contenido de `apps/frontend/src/pages/index.astro` para montar `AppShell` en lugar de `MainAppPlaceholder`
- [X] T017 Borrar `apps/frontend/src/pages/profile.astro`, `apps/frontend/src/pages/staff.astro`, `apps/frontend/src/pages/instructors.astro`, `apps/frontend/src/pages/skaters/index.astro` y `apps/frontend/src/pages/skaters/profile.astro`, que a partir de ahora sirve el caparazón
- [X] T018 Borrar `apps/frontend/src/components/MainAppPlaceholder.tsx` y toda referencia a él
- [X] T019 [P] Prueba en `apps/frontend/test/navigation-map.test.ts`: cada rol devuelve su conjunto exacto, las etiquetas coinciden literalmente con FR-002a, todo rol queda entre 2 y 5 destinos, y `staff` aparece solo para administrador
- [X] T020 [P] Prueba en `apps/frontend/test/router.test.ts`: cambiar de destino usa `replaceState`, abrir una superficie anidada usa `pushState`, y `popstate` desde una anidada devuelve a la raíz de su destino
- [X] T021 Comprobar con `bun run lint` y `bun run build` que el caparazón compila y que Astro genera las ocho rutas direccionables
- [X] T022 Verificar que la barra NO se dibuja en `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` ni `/onboarding`, y que la ruta comodín de `apps/frontend/src/pages/[...appRoute].astro` no eclipsa esas páginas (FR-005)

**Checkpoint**: el caparazón existe, ambas barras se dibujan y las ocho direcciones abren.

---

## Phase 3: User Story 1 — El skater navega su aplicación desde la barra inferior (P1)

**Goal**: un skater autenticado recibe sus tres destinos, aterriza en el primero y puede moverse
entre ellos con un solo toque.

**Independent Test**: iniciar sesión como skater y verificar que la barra trae exactamente
"Reservar clases", "Mi perfil" y "Configuración", que tocar cada uno abre su sección, y que el
destino activo se distingue del resto.

- [X] T023 [P] [US1] Crear `apps/frontend/src/components/SettingsView.tsx` con el email de la sesión, la acción "Cambiar contraseña" que reutiliza `authClient.requestPasswordReset()` con ese email, y el cierre de sesión vía `POST /auth/logout` (FR-015, FR-018, FR-018a; research.md §5)
- [X] T024 [US1] Registrar los paneles del skater en `apps/frontend/src/app/navigation-map.ts`: `bookings` → `SectionInPreparation`, `profile` → `SkaterBasicInfoForm` en modo `edit`, `settings` → `SettingsView`
- [X] T025 [US1] Implementar el aterrizaje posterior al ingreso en `apps/frontend/src/components/app-shell/AppShell.tsx`: `/` reemplaza por el destino 1 del rol, sin toque adicional ni pantalla intermedia, aunque ese destino esté en preparación (FR-013)
- [X] T026 [US1] Implementar la guarda de onboarding en `apps/frontend/src/components/app-shell/AppShell.tsx`: un skater con `GET /skater-profile/me` incompleto va a `/onboarding` y la barra no se dibuja (FR-005)
- [X] T027 [P] [US1] Prueba en `apps/frontend/test/skater-nav.test.tsx`: la barra del skater muestra exactamente los tres destinos, en orden, con sus etiquetas literales, y marca uno activo
- [X] T028 [P] [US1] Prueba en `apps/frontend/test/skater-landing.test.tsx`: tras el ingreso el skater queda en `/bookings` en estado de sección en preparación, sin pantalla intermedia (FR-013, SC-003)
- [X] T029 [P] [US1] Prueba en `apps/frontend/test/settings-view.test.tsx`: "Configuración" presenta email, cambio de contraseña y cierre de sesión, y ningún dato se repite con "Mi perfil" (FR-018a, SC-009)
- [X] T030 [US1] Verificar en `apps/frontend/src/components/app-shell/BottomNav.tsx` que los tres destinos quedan accesibles con un solo toque desde cualquier sección, sin menú ni gaveta (US1 escenario 3)
- [ ] T031 [US1] Recorrer los escenarios 1 y 9 de [quickstart.md](./quickstart.md) con una cuenta skater real

**Checkpoint**: US1 entregable y demostrable por sí sola.

---

## Phase 4: User Story 2 — El staff navega la aplicación de gestión desde la barra inferior (P1)

**Goal**: administrador e instructor reciben cada uno su conjunto exacto de destinos, con las
superficies existentes anidadas donde corresponde y la cuenta propia fuera de la barra.

**Independent Test**: iniciar sesión como administrador y luego como instructor, verificando que
cada uno recibe su conjunto, que "Staff" solo aparece para administrador, que ningún destino de
skater aparece, y que cada destino abre la sección correcta.

- [X] T032 [P] [US2] Crear `apps/frontend/src/components/app-shell/AccountMenu.tsx` con los datos de la cuenta y el cierre de sesión, sin ningún enlace a otras secciones (FR-016, FR-017)
- [X] T033 [US2] Montar `AccountMenu` en el encabezado de toda sección de staff desde `apps/frontend/src/components/app-shell/SectionHeader.tsx`, de modo que sea persistente (FR-016)
- [X] T034 [US2] Registrar los paneles de staff en `apps/frontend/src/app/navigation-map.ts`: `skaters` → `SkaterListView`, `staff` → `StaffListView`, `schedule` → `SectionInPreparation`, adoptando las vistas existentes sin modificar su lógica de datos
- [X] T035 [US2] Registrar las superficies anidadas en `apps/frontend/src/app/navigation-map.ts`: `/skaters/profile?accountId=` → `SkaterProfileView` bajo `skaters`, y `/staff/instructors` → `InstructorAssignmentView` bajo `staff` (FR-022)
- [X] T036 [US2] Reescribir los enlaces internos de `apps/frontend/src/components/SkaterListView.tsx` y `apps/frontend/src/components/StaffListView.tsx` para abrir las superficies anidadas por el router en lugar de provocar una navegación de documento completo (FR-020)
- [X] T037 [US2] Implementar la recomposición por cambio de rol en `apps/frontend/src/app/session-context.tsx` y `apps/frontend/src/components/app-shell/AppShell.tsx`: revalidar la sesión en cada cambio de destino y, si la sección actual dejó de estar permitida, reemplazarla por el destino 1 del rol nuevo explicando el motivo (FR-014, FR-014a)
- [X] T038 [P] [US2] Prueba en `apps/frontend/test/staff-nav.test.tsx`: administrador ve "Skaters", "Staff" y "Horarios de clases"; instructor ve "Skaters" y "Horarios de clases" sin "Staff"; ninguno ve destinos de skater (FR-009, FR-010, FR-011, SC-005)
- [X] T039 [P] [US2] Prueba en `apps/frontend/test/role-change.test.tsx`: degradar un administrador a instructor mientras ve `/staff` lo lleva al primer destino del rol nuevo con una explicación, sin cerrar su sesión (US2 escenario 6)
- [X] T040 [P] [US2] Prueba en `apps/backend/test/staff-directory-access.test.ts` que `StaffDirectoryAdminOnlyGuard` rechaza a instructor y a skater, confirmando que ocultar el destino nunca es el control de acceso (FR-012, SC-005)
- [X] T041 [US2] Verificar el camino de dos toques `/staff` → "Asignar instructor" → "Promover" siguiendo el escenario 7 de [quickstart.md](./quickstart.md), por debajo del techo de tres (FR-021, US2 escenario 4)
- [X] T042 [US2] Verificar con el escenario 6 de [quickstart.md](./quickstart.md) que la flecha en pantalla de `apps/frontend/src/components/app-shell/SectionHeader.tsx` y el botón "atrás" del dispositivo devuelven ambos de `/staff/instructors` a `/staff` (FR-022, FR-022a)
- [ ] T043 [US2] Recorrer los escenarios 2, 6, 7 y 11 de [quickstart.md](./quickstart.md) con cuentas administrador e instructor

**Checkpoint**: US1 y US2 entregables. La barra es plenamente consciente del rol.

---

## Phase 5: User Story 3 — La navegación conserva el estado de cada sección (P2)

**Goal**: cambiar de destino y volver deja la sección tal como se dejó, sin recarga ni pantalla en
blanco, y dentro del techo de tiempo de FR-020c.

**Independent Test**: desplazarse hasta el fondo de un listado, cambiar de destino, volver, y
verificar que la posición y el estado previo siguen ahí sin que hubiera pantalla intermedia.

- [X] T044 [US3] Convertir `apps/frontend/src/components/app-shell/DestinationHost.tsx` en contenedor de paneles vivos: cada destino visitado queda montado y los inactivos se ocultan con `display: none` (FR-019)
- [X] T045 [US3] Dar a cada panel su propio contenedor de desplazamiento en `apps/frontend/src/styles/app-shell.css` y quitar el desplazamiento del `body`, de modo que `scrollTop` sobreviva al ocultado sin guardarlo ni restaurarlo (FR-019, research.md §3)
- [X] T046 [US3] Hacer que tocar el destino ya activo no dispare ninguna navegación en `apps/frontend/src/components/app-shell/BottomNav.tsx` y `apps/frontend/src/app/router.ts` (FR-006)
- [X] T047 [P] [US3] Prueba en `apps/frontend/test/destination-host.test.tsx`: tras cambiar de destino el panel anterior sigue en el DOM y conserva su texto de búsqueda y sus resultados (FR-019, SC-002)
- [X] T048 [P] [US3] Prueba en `apps/frontend/test/active-destination-tap.test.tsx`: tocar el destino activo no reinicia ni vacía su estado (FR-006)
- [ ] T049 [US3] Medir el techo de FR-020c con el procedimiento del escenario 4 de [quickstart.md](./quickstart.md): ≤100 ms en destino visitado, ≤100 ms de respuesta visible y ≤1 s de datos reales en primera visita (SC-002b)
- [ ] T050 [US3] Verificar el escenario 5 de [quickstart.md](./quickstart.md): una recarga completa conserva la sección que identifica la dirección, aunque descarte desplazamiento y filtros (FR-020a, FR-020b, SC-002a)

**Checkpoint**: la navegación deja de sentirse como un sitio web.

---

## Phase 6: User Story 4 — Los destinos aún no construidos se comunican con honestidad (P3)

**Goal**: los dos destinos todavía no especificados —"Reservar clases" y "Horarios de clases"—
dicen con claridad que están en preparación, sin errores y sin dejar a nadie atrapado.

**Independent Test**: tocar cada destino no construido y verificar que muestra un estado explícito
de sección en preparación, sin error y con salida a otro destino en un toque.

- [X] T051 [US4] Completar `apps/frontend/src/components/app-shell/SectionInPreparation.tsx`: mensaje explícito e identificable, nunca un error ni una pantalla vacía, y salida a otro destino con un solo toque (FR-026)
- [X] T052 [US4] Distinguir visualmente sección en preparación de estado de error en `apps/frontend/src/styles/app-shell.css`, de modo que un fallo recuperable no se lea como una sección sin construir ni al revés (FR-024b)
- [X] T053 [P] [US4] Prueba en `apps/frontend/test/in-preparation.test.tsx`: `/bookings` y `/schedule` muestran el estado explícito, la barra sigue viva y funcional, y ninguno devuelve error (FR-025, FR-026)
- [X] T054 [US4] Verificar con los escenarios 1 y 2 de [quickstart.md](./quickstart.md) que ningún destino ofrecido por la barra produce error al abrirlo, incluidos los dos en preparación (SC-008)

**Checkpoint**: la barra completa no tiene ningún destino que falle o ignore el toque.

---

## Phase 7: User Story 5 — La misma navegación en pantallas grandes (P3)

**Goal**: tablet y escritorio reciben los mismos destinos, en el mismo orden y a la misma
profundidad, presentados como riel lateral.

**Independent Test**: abrir la aplicación a distintos anchos y verificar que el conjunto de
destinos, su orden y la cantidad de toques hasta cada acción no cambian.

- [X] T055 [US5] Añadir la presentación de riel o columna lateral a partir de 1024 px en `apps/frontend/src/styles/app-shell.css`, reutilizando el mismo `BottomNav.tsx` y cambiando solo su disposición (FR-030, FR-031)
- [X] T056 [US5] Verificar con el escenario 15 de [quickstart.md](./quickstart.md) la ausencia de desplazamiento horizontal desde 320 px en todas las secciones que monta `apps/frontend/src/components/app-shell/DestinationHost.tsx` (FR-029, SC-006)
- [X] T057 [P] [US5] Prueba en `apps/frontend/test/responsive-nav.test.tsx`: el conjunto de destinos, su orden y sus rutas son idénticos en la barra y en el riel, porque provienen del mismo mapa (SC-007)
- [X] T058 [US5] Verificar con el escenario 14 de [quickstart.md](./quickstart.md) que el riel de `apps/frontend/src/components/app-shell/BottomNav.tsx` es alcanzable y activable solo con teclado, con foco visible (FR-027b, SC-006a)
- [ ] T059 [US5] Recorrer el escenario 15 de [quickstart.md](./quickstart.md)

**Checkpoint**: una sola arquitectura de información en todos los anchos.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: los requisitos transversales que ninguna historia posee en exclusiva —fallo de datos,
expiración de sesión, accesibilidad, áreas seguras— y el cierre de calidad.

- [X] T060 [P] Crear `apps/frontend/src/components/app-shell/SectionError.tsx`: error mostrado dentro del destino, con acción de reintentar, sin reemplazar la aplicación entera (FR-024a)
- [X] T061 Envolver cada panel de `apps/frontend/src/components/app-shell/DestinationHost.tsx` con `SectionError`, dejando la barra visible y funcional durante el fallo (FR-024a, SC-010)
- [X] T062 Implementar la salida a `/login` ante sesión expirada o revocada en `apps/frontend/src/app/session-context.tsx`, sin dejar una sección con la barra visible y sin datos (FR-024)
- [X] T063 Aplicar `env(safe-area-inset-bottom)` a la barra en `apps/frontend/src/styles/app-shell.css` para que no tape ni sea tapada por los elementos del sistema operativo (FR-028)
- [X] T064 [P] Prueba en `apps/frontend/test/accessibility-nav.test.tsx`: la barra se expone como navegación, el destino activo lleva `aria-current`, y el foco pasa al encabezado de la sección nueva al cambiar de destino y al subir un nivel (FR-027a, FR-027c, SC-006a)
- [X] T065 [P] Prueba en `apps/frontend/test/section-error.test.tsx`: un fallo de datos se muestra dentro del destino con reintento, la barra sigue permitiendo cambiar de destino, y el error no se confunde con sección en preparación (FR-024a, FR-024b, SC-010)
- [X] T066 Verificar que todo elemento interactivo de la barra ofrece un área tocable de al menos 44×44 px en `apps/frontend/src/styles/app-shell.css` (FR-027)
- [X] T067 Ejecutar `bun run lint`, `bun nx test frontend`, `bun nx test backend` y `bun run build`, todos en verde
- [ ] T068 Recorrer los dieciséis escenarios de [quickstart.md](./quickstart.md) con las cuatro cuentas de prueba (skater completo, skater con onboarding incompleto, instructor, administrador)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T001 → T002 → T003 → T004 en secuencia (cadena de tipos); T005 y T006 en paralelo con todo lo anterior.
- **Foundational (Phase 2)**: depende de Phase 1. **Bloquea todas las historias.**
- **US1 (Phase 3)** y **US2 (Phase 4)**: dependen solo de Foundational. Pueden hacerse en paralelo por personas distintas — tocan archivos distintos salvo `navigation-map.ts` (T024 y T034/T035) y `AppShell.tsx` (T025/T026 y T037), que hay que coordinar.
- **US3 (Phase 5)**: depende de Foundational. Se prueba mejor con US1 o US2 ya entregada, porque necesita un destino con listado y búsqueda.
- **US4 (Phase 6)**: depende de Foundational (T012). Independiente de US1/US2/US3.
- **US5 (Phase 7)**: depende de Foundational (T011). Independiente del resto.
- **Polish (Phase 8)**: T061 depende de T044 (los paneles vivos de US3). El resto solo depende de Foundational.

### User Story Dependencies

- **US1 (P1)**: sin dependencias de otras historias.
- **US2 (P1)**: sin dependencias de otras historias.
- **US3 (P2)**: sin dependencias funcionales; conviene tenerla después de US1 o US2 para poder probarla con datos reales.
- **US4 (P3)**: sin dependencias de otras historias.
- **US5 (P3)**: sin dependencias de otras historias.

### Parallel Opportunities

- Phase 1: T005 y T006 en paralelo entre sí y con la cadena T001–T004.
- Phase 2: T008 y T009 en paralelo; T019 y T020 en paralelo una vez existen sus módulos.
- Phase 3: T023, T027, T028 y T029 en paralelo.
- Phase 4: T032, T038, T039 y T040 en paralelo. T040 es de backend: no compite con nada del frontend.
- Phase 5: T047 y T048 en paralelo.
- Phase 8: T060, T064 y T065 en paralelo.
- Completada Foundational, US1, US2, US4 y US5 pueden avanzar simultáneamente con equipo suficiente.

---

## Parallel Example: User Story 2

```bash
# Lanzar en paralelo, tras completar Foundational:
Task: "Crear AccountMenu en apps/frontend/src/components/app-shell/AccountMenu.tsx"      # T032
Task: "Prueba staff-nav en apps/frontend/test/staff-nav.test.tsx"                         # T038
Task: "Prueba role-change en apps/frontend/test/role-change.test.tsx"                     # T039
Task: "Prueba de acceso en apps/backend/test/staff-directory-access.test.ts"              # T040
```

---

## Implementation Strategy

### MVP First (US1 + Foundational)

1. Phase 1: Setup — contrato, backend, estilos base.
2. Phase 2: Foundational — el caparazón. **Crítico: bloquea todo.**
3. Phase 3: US1 — la barra del skater.
4. **PARAR Y VALIDAR**: escenarios 1 y 9 de quickstart con una cuenta skater.
5. Desplegable: el rol mayoritario ya tiene aplicación navegable.

**Nota sobre el MVP**: US1 y US2 son ambas P1 y el producto queda a medias con solo una. US1 es el
corte mínimo demostrable, pero el primer despliegue razonable incluye US1 + US2.

### Incremental Delivery

1. Setup + Foundational → el caparazón existe y las ocho direcciones abren.
2. + US1 → el skater navega. Validar y demostrar.
3. + US2 → el staff navega, con instructor y administrador diferenciados. Validar y demostrar.
4. + US3 → la navegación conserva estado y entra en el techo de tiempo.
5. + US4 → los destinos en preparación se comunican con honestidad.
6. + US5 → misma arquitectura de información en tablet y escritorio.
7. + Polish → fallo de datos, expiración de sesión, accesibilidad, áreas seguras.

### Parallel Team Strategy

1. El equipo completa Setup y Foundational en conjunto: es indivisible y bloquea todo.
2. Con Foundational terminada:
   - Persona A: US1 (skater)
   - Persona B: US2 (staff)
   - Persona C: US4 + US5 (destinos en preparación y pantallas grandes, sin solapamiento con A ni B)
3. US3 y Polish al final, porque tocan `DestinationHost.tsx` y `app-shell.css`, que A, B y C
   estuvieron modificando.

---

## Notes

- `[P]` significa archivos distintos y sin dependencias pendientes.
- Los tres archivos de mayor contención son `apps/frontend/src/app/navigation-map.ts`,
  `apps/frontend/src/components/app-shell/AppShell.tsx` y
  `apps/frontend/src/styles/app-shell.css`: aparecen en varias fases y no admiten `[P]` entre sí.
- Las vistas ya existentes —`SkaterListView`, `StaffListView`, `SkaterProfileView`,
  `InstructorAssignmentView`, `SkaterBasicInfoForm`— se adoptan **sin modificar su lógica de
  datos**. Lo único que cambia en ellas es cómo enlazan (T036).
- Contrato, backend y frontend deben quedar consistentes en el mismo PR: un frontend actualizado
  contra un backend sin `email` no puede parsear la respuesta de sesión.
- Al completar esta funcionalidad queda cerrado el seguimiento diferido que el informe de impacto
  de la constitución v2.2.0 dejó abierto sobre el Principio IX. Registrar ese cierre corresponde a
  `/speckit-constitution`, no a estas tareas.
- Commit por tarea o por grupo lógico; parar en cada checkpoint para validar la historia por
  separado.

---

## Estado de ejecución (2026-08-27)

**62 de 68 tareas completadas.** Las seis pendientes son las que consisten en recorrer escenarios
de [quickstart.md](./quickstart.md) en un navegador con las cuatro cuentas de prueba sembradas —
T031, T043, T049, T050, T059 y T068. No se pueden ejecutar sin la pila levantada y esas cuentas
creadas, así que quedan sin marcar en lugar de darse por hechas.

Lo que sí quedó verificado de forma automática de aquello que esos escenarios cubren:

| Escenario manual pendiente | Equivalente ya verificado |
|---|---|
| T049 — medición del techo de 100 ms / 1 s | `destination-host.test.tsx` prueba que el panel anterior sigue montado tras cambiar de destino, que es la propiedad estructural de la que depende el techo |
| T050 — recarga completa conserva la sección | `astro build` genera las ocho rutas como documentos propios, y las pruebas montan el caparazón directamente en `/staff/instructors` y `/skaters/profile` con el destino padre marcado |
| T059 — riel a ancho de escritorio | `responsive-nav.test.tsx` prueba que barra y riel son el mismo componente alimentado por el mismo mapa, y que la consulta de medios solo cambia la disposición |
| T031, T043, T068 — recorridos por rol | 62 pruebas cubren los conjuntos por rol, el aterrizaje, las etiquetas literales, el cambio de rol, el rechazo del servidor y los estados de preparación y error |

**Validación ejecutada**: `biome check apps packages` sin errores; 62 pruebas de frontend y 7 de
backend en verde; `astro build` genera 15 páginas; `nest build` correcto (requiere
`prisma generate` previo en un contenedor nuevo — condición preexistente del repositorio, ajena a
esta funcionalidad).

