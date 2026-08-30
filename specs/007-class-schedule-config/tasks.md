---

description: "Task list for 007-class-schedule-config"
---

# Tasks: Configuración del Calendario de Clases

**Input**: Design documents from `/specs/007-class-schedule-config/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: SÍ se incluyen. El plan los declara como entregable y 006 ya dejó la infraestructura
montada y en uso (`bun test` con `@testing-library/react` y `happy-dom` en el frontend, pruebas de
unidad directas en el backend). Lo que esta funcionalidad aporta es sobre todo lógica de validación
pura —solapamiento, límites del horario, día cerrado, horas invertidas— que se prueba mejor como
funciones de dominio que a través de la interfaz.

**Organization**: agrupadas por historia de usuario para poder implementarlas y probarlas de forma
independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: a qué historia de usuario pertenece (US1…US4)
- Toda tarea lleva su ruta de archivo exacta

## Path Conventions

Monorepo Nx: `packages/contracts/src/`, `apps/backend/src/`, `apps/backend/test/`,
`apps/backend/prisma/`, `apps/frontend/src/`, `apps/frontend/test/`. Todo se ejecuta por Docker
Compose (`bun run up`), nunca en el host.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: el contrato primero (Principio III) y el esquema que esta funcionalidad estrena. Es la
primera migración del producto que agrega tablas de negocio.

- [X] T001 Crear `packages/contracts/src/class-schedule/errors.ts` con `ClassScheduleErrorCode` (los ocho códigos) y `classScheduleErrorBodySchema`, incluidos los campos opcionales `conflictingClass` y `conflictingClasses` que FR-022 y FR-016 necesitan para nombrar el conflicto
- [X] T002 Crear `packages/contracts/src/class-schedule/schedule.contract.ts` con los tipos compartidos, las cinco rutas y la unión discriminada de `setSkateparkDayHoursRequestSchema`, según [contracts/class-schedule-endpoints.md](./contracts/class-schedule-endpoints.md). Las horas MUST viajar como enteros de minutos, nunca como cadena ni fecha
- [X] T003 Crear `packages/contracts/src/class-schedule/index.ts` y exportarlo desde `packages/contracts/src/index.ts`
- [X] T004 Agregar los enums `DayOfWeek`, `ClassAgeGroup` y `ClassLevel` y los modelos `ScheduledClass` y `SkateparkHours` a `apps/backend/prisma/schema.prisma`, según [data-model.md](./data-model.md). El orden de declaración de `DayOfWeek` es el orden de la semana y de ahí sale el orden de la grilla
- [X] T005 Generar la migración en `apps/backend/prisma/migrations/` ejecutando `prisma migrate dev --name add_class_schedule` dentro del contenedor de backend, y verificar que solo agrega tablas y enums sin tocar `accounts` ni ninguna tabla en uso
- [X] T006 [P] Crear `apps/frontend/src/styles/class-schedule.css` con la grilla, el selector de día, las tarjetas de clase y las hojas modales, usando exclusivamente las variables de `apps/frontend/src/styles/tokens.css` (Principio VI)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el módulo de backend y su conexión con el caparazón del frontend. Ninguna historia
puede empezar sin el repositorio, los permisos y el cliente.

**⚠️ CRITICAL**: ninguna historia de usuario puede comenzar hasta terminar esta fase.

- [X] T007 Crear las entidades de dominio en `apps/backend/src/modules/class-schedule/domain/entities/scheduled-class.entity.ts` y `.../skatepark-hours.entity.ts`, con las horas como minutos desde medianoche y sin ningún tipo de NestJS ni de Prisma (Principio II)
- [X] T008 [P] Crear `apps/backend/src/modules/class-schedule/domain/services/schedule-rules.ts` con la validación de rango de una clase como función pura: `0 <= inicio < fin <= 1440` (FR-019, FR-020). Al no existir campo de fecha, cruzar la medianoche no es representable
- [X] T009 Crear el puerto `apps/backend/src/modules/class-schedule/domain/ports/class-schedule.repository.ts` como `abstract class`, con lectura de clases y horarios, escritura de clase y escritura de horario de un día (Principio II: abstract class que hace de token de DI)
- [X] T010 [P] Crear el puerto `apps/backend/src/modules/class-schedule/domain/ports/current-session-resolver.ts` propio de este módulo, siguiendo el patrón que 002, 003, 004 y 005 ya declaran cada uno por su cuenta
- [X] T011 Crear el adaptador `apps/backend/src/modules/auth/infrastructure/class-schedule-bridge/auth-class-schedule-session-resolver.adapter.ts` que implementa ese puerto envolviendo `SessionGuard`, y exportarlo desde `apps/backend/src/modules/auth/auth.module.ts`
- [X] T012 Implementar `apps/backend/src/modules/class-schedule/infrastructure/persistence/class-schedule.repository.ts` sobre Prisma, devolviendo las clases ordenadas por día y hora de inicio para que la pantalla no tenga que reordenar
- [X] T013 [P] Crear `apps/backend/src/modules/class-schedule/infrastructure/http/class-schedule-staff.guard.ts`, que admite instructor y administrador para la lectura (FR-026a)
- [X] T014 [P] Crear `apps/backend/src/modules/class-schedule/infrastructure/http/class-schedule-admin-only.guard.ts`, que admite solo administrador para las cuatro escrituras (FR-026)
- [X] T015 Crear `apps/backend/src/modules/class-schedule/class-schedule.module.ts` registrando el repositorio contra su puerto, las dos guardias y los casos de uso, y registrarlo en `apps/backend/src/app.module.ts`
- [X] T016 Crear `apps/frontend/src/services/class-schedule-client.ts` consumiendo los tipos de `@nodoskatepark/contracts`, siguiendo el patrón de `apps/frontend/src/services/staff-directory-client.ts`
- [X] T017 [P] Prueba en `apps/backend/test/schedule-rules.test.ts` de la validación de rango: fin posterior al inicio, límites 0 y 1440, y que una clase que cruzaría la medianoche no es representable (FR-019, FR-020)
- [X] T018 Verificar con `bun nx test backend` y `bun run build` que el módulo compila y que la migración se aplica sola al levantar el contenedor de backend

**Checkpoint**: el módulo existe, tiene permisos y el frontend puede hablarle.

---

## Phase 3: User Story 1 — El administrador arma la grilla semanal (Priority: P1)

**Goal**: un administrador ve la sección con las clases de un día y puede crear clases nuevas con
día, rango horario y categoría.

**Independent Test**: iniciar sesión como administrador, crear varias clases con distintos días,
horas y categorías, y verificar que la sección las muestra en el día correcto y que sobreviven a una
recarga.

- [X] T019 [US1] Agregar a `apps/backend/src/modules/class-schedule/domain/services/schedule-rules.ts` la detección de solapamiento como función pura —`aInicio < bFin && bInicio < aFin` para el mismo día—, que MUST rechazar aunque las categorías difieran (FR-021)
- [X] T020 [US1] Crear `apps/backend/src/modules/class-schedule/application/use-cases/get-class-schedule.use-case.ts` devolviendo clases y horarios en una sola lectura (research.md §6)
- [X] T021 [US1] Crear `apps/backend/src/modules/class-schedule/application/use-cases/create-scheduled-class.use-case.ts` validando rango y solapamiento **dentro de una transacción**, para cerrar la ventana entre comprobar y escribir (research.md §5)
- [X] T022 [US1] Crear `apps/backend/src/modules/class-schedule/infrastructure/http/class-schedule.controller.ts` con `GET /class-schedule` bajo la guardia de staff y `POST /class-schedule/classes` bajo la de administrador, traduciendo los errores de dominio a los códigos del contrato
- [X] T023 [P] [US1] Crear `apps/frontend/src/components/class-schedule/DaySelector.tsx`: una fila de botones con `aria-pressed` marcando el día activo, alcanzables por teclado con foco visible (FR-033, research.md §9)
- [X] T024 [P] [US1] Crear `apps/frontend/src/components/class-schedule/DayClassList.tsx` mostrando las clases del día ordenadas por hora, cada una con su horario y su categoría como texto (FR-004, FR-004a)
- [X] T025 [US1] Crear `apps/frontend/src/components/class-schedule/ClassSchedulePanel.tsx`: carga la grilla, arranca en el día actual (FR-001c), presenta el estado explícito de "sin clases" cuando el día está vacío (FR-005) y no requiere desplazamiento horizontal desde 320 px (FR-001a)
- [X] T026 [US1] Crear `apps/frontend/src/components/class-schedule/ClassFormSheet.tsx` como hoja modal de creación, con día, hora de inicio, hora de fin, franja etaria y nivel; propone una hora de duración y permite cambiarla (FR-003), y convierte `"HH:MM"` a minutos solo en este borde (data-model.md §3)
- [X] T027 [US1] Hacer que la hoja apile una entrada de historial al abrirse y la quite al cerrarse, en `apps/frontend/src/components/class-schedule/ClassFormSheet.tsx`, de modo que el botón "atrás" del dispositivo la cierre en lugar de sacar del entorno autenticado. Sin esto, quien esté a medio cargar una clase y toque "atrás" pierde el formulario (research.md §8, 006 FR-022a)
- [X] T028 [US1] Cambiar `status` de `'in-preparation'` a `'built'` en la constante `SCHEDULE` de `apps/frontend/src/app/navigation-map.ts`. **Sin esto el destino nunca se muestra**: `renderDestination()` corta por `status` antes de consultar el mapa de paneles, así que conectar el registro por sí solo no tiene ningún efecto
- [X] T029 [US1] Conectar el panel en `apps/frontend/src/app/destination-registry.tsx`: agregar `schedule: () => <ClassSchedulePanel />` a `DESTINATION_PANELS`. Junto con T027, son los dos únicos archivos del caparazón que cambian (FR-031)
- [X] T030 [P] [US1] Prueba en `apps/backend/test/class-overlap.test.ts`: dos clases del mismo día que se solapan se rechazan, incluso con categorías distintas; dos consecutivas que se tocan en el borde no se solapan (FR-021)
- [X] T031 [P] [US1] Prueba en `apps/frontend/test/class-schedule-panel.test.tsx`: la sección arranca en el día actual, muestra el estado vacío cuando no hay clases, y lista las del día con su horario y categoría (FR-001c, FR-005, FR-004a)
- [X] T032 [P] [US1] Prueba en `apps/frontend/test/day-selector.test.tsx`: los siete días son botones alcanzables por teclado, solo uno lleva `aria-pressed`, y cambiar de día cuesta un solo toque
- [ ] T033 [US1] Recorrer los escenarios 1 y 2 de [quickstart.md](./quickstart.md) con una cuenta administrador real

**Checkpoint**: US1 entregable. El destino deja de estar en preparación y la grilla es utilizable.

---

## Phase 4: User Story 2 — El administrador define cuándo abre el skatepark (Priority: P2)

**Goal**: el horario de apertura se configura día por día, con la posibilidad de cerrar un día, y
acota dónde puede ubicarse cada clase.

**Independent Test**: configurar horarios distintos para dos días, intentar crear una clase fuera
del horario de uno y verificar que se rechaza con la explicación, y luego crear una dentro y
verificar que se guarda.

- [X] T034 [US2] Agregar a `apps/backend/src/modules/class-schedule/domain/services/schedule-rules.ts` las reglas del horario como funciones puras: clase dentro del rango del día (FR-014, FR-015), rechazo en día cerrado (FR-015a), y ausencia de fila como "sin configurar" que no restringe (FR-018)
- [X] T035 [US2] Crear `apps/backend/src/modules/class-schedule/application/use-cases/set-skatepark-day-hours.use-case.ts`, que valida apertura anterior al cierre (FR-017) y **rechaza el cambio identificando las clases que quedarían fuera** en lugar de borrarlas o moverlas (FR-016)
- [X] T036 [US2] Agregar `PUT /class-schedule/hours/:dayOfWeek` a `apps/backend/src/modules/class-schedule/infrastructure/http/class-schedule.controller.ts` bajo la guardia de administrador, devolviendo `conflictingClasses` en el cuerpo del error cuando corresponda
- [X] T037 [US2] Aplicar las reglas de horario a la creación en `apps/backend/src/modules/class-schedule/application/use-cases/create-scheduled-class.use-case.ts`, devolviendo `outside_opening_hours` o `day_closed` según el caso
- [X] T038 [US2] Crear `apps/frontend/src/components/class-schedule/SkateparkHoursSheet.tsx` como hoja modal del horario de un día, con la opción de marcarlo como cerrado y la lista de clases en conflicto cuando el cambio se rechaza
- [X] T039 [US2] Mostrar en `apps/frontend/src/components/class-schedule/ClassSchedulePanel.tsx` el horario del día visible, distinguiendo los tres estados —sin configurar, cerrado, abierto— porque los dos primeros son opuestos y confundirlos rompe FR-018
- [X] T040 [P] [US2] Prueba en `apps/backend/test/skatepark-hours.test.ts`: clase fuera del rango rechazada, clase en día cerrado rechazada, día sin configurar sin restricción, y cierre anterior o igual a la apertura rechazado (FR-014 a FR-018)
- [X] T041 [P] [US2] Prueba en `apps/backend/test/hours-change-conflict.test.ts`: achicar el horario o cerrar un día con clases dentro no aplica el cambio y devuelve las clases que lo impiden (FR-016)
- [ ] T042 [US2] Recorrer los escenarios 3, 4 y 5 de [quickstart.md](./quickstart.md)

**Checkpoint**: la grilla deja de admitir clases imposibles.

---

## Phase 5: User Story 3 — El administrador corrige la grilla (Priority: P2)

**Goal**: modificar el día, la hora y la categoría de una clase existente, y eliminarla previa
confirmación.

**Independent Test**: crear una clase, cambiarle día, hora y categoría, verificar que la sección lo
refleja, y luego eliminarla y verificar que desaparece.

- [X] T043 [US3] Crear `apps/backend/src/modules/class-schedule/application/use-cases/update-scheduled-class.use-case.ts` aplicando exactamente las mismas validaciones que la creación (FR-025), excluyendo la propia clase del cálculo de solapamiento
- [X] T044 [P] [US3] Crear `apps/backend/src/modules/class-schedule/application/use-cases/delete-scheduled-class.use-case.ts`, que borra de verdad: no hay borrado en blando porque la grilla no lleva historial (FR-025a)
- [X] T045 [US3] Agregar `PUT /class-schedule/classes/:id` y `DELETE /class-schedule/classes/:id` a `apps/backend/src/modules/class-schedule/infrastructure/http/class-schedule.controller.ts`, devolviendo `not_found` cuando el id no existe
- [X] T046 [US3] Extender `apps/frontend/src/components/class-schedule/ClassFormSheet.tsx` con el modo de edición, precargando los valores de la clase elegida
- [X] T047 [US3] Agregar en `apps/frontend/src/components/class-schedule/DayClassList.tsx` el acceso a editar y a eliminar, con confirmación explícita antes de borrar (FR-024)
- [X] T048 [P] [US3] Prueba en `apps/backend/test/update-scheduled-class.test.ts`: la edición pasa por las mismas validaciones que la creación y una clase no se solapa consigo misma (FR-025)
- [X] T049 [P] [US3] Prueba en `apps/frontend/test/class-form-sheet.test.tsx`: el modo edición precarga los valores, eliminar pide confirmación antes de borrar, y guardar sin franja etaria o sin nivel se rechaza explicando cuál falta (FR-011)
- [ ] T050 [US3] Recorrer el escenario 7 de [quickstart.md](./quickstart.md)

**Checkpoint**: la grilla se puede mantener sin rehacerla.

---

## Phase 6: User Story 4 — El instructor consulta sin modificar (Priority: P3)

**Goal**: un instructor ve la grilla completa y no encuentra ninguna acción de modificación; el
servidor lo rechaza igual si lo intenta por otro medio.

**Independent Test**: iniciar sesión como instructor, abrir el destino, verificar que ve todas las
clases con sus categorías y horarios, y que no hay ninguna acción para crear, editar, eliminar ni
tocar el horario.

- [X] T051 [US4] Derivar el rol de la sesión en `apps/frontend/src/components/class-schedule/ClassSchedulePanel.tsx` y ocultar toda acción de modificación para instructor, sin ofrecer nada que luego sería rechazado (FR-028)
- [X] T052 [US4] Ocultar el acceso a editar y eliminar en `apps/frontend/src/components/class-schedule/DayClassList.tsx` cuando el rol no es administrador
- [X] T053 [P] [US4] Prueba en `apps/backend/test/class-schedule-permissions.test.ts`: la guardia de staff admite instructor y administrador y rechaza skater; la de administrador rechaza instructor y skater (FR-026, FR-026a, FR-027, SC-007)
- [X] T054 [P] [US4] Prueba en `apps/frontend/test/class-schedule-readonly.test.tsx`: con sesión de instructor se ven todas las clases y no aparece ninguna acción de crear, editar, eliminar ni configurar horario
- [ ] T055 [US4] Recorrer los escenarios 9 y 10 de [quickstart.md](./quickstart.md), incluida la llamada directa con `curl` que confirma el rechazo del servidor

**Checkpoint**: el rol de solo lectura significa algo, en la pantalla y en el servidor.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: la presentación en pantallas grandes, la base de accesibilidad, el estado de error y el
cierre de calidad. Ninguna historia posee estos en exclusiva.

- [X] T056 [P] Crear `apps/frontend/src/components/class-schedule/WeekColumns.tsx` con la semana completa en columnas, y activarla desde 1024 px en `apps/frontend/src/styles/class-schedule.css`. Las mismas clases y la misma cantidad de toques que en teléfono; lo único que cambia es cuántos días se ven a la vez (FR-001b)
- [X] T057 Asociar una etiqueta a cada campo de `apps/frontend/src/components/class-schedule/ClassFormSheet.tsx` y `.../SkateparkHoursSheet.tsx`, legible por lector de pantalla (FR-034)
- [X] T058 Anunciar los rechazos de validación y trasladar el foco al campo que hay que corregir en `apps/frontend/src/components/class-schedule/ClassFormSheet.tsx` y `.../SkateparkHoursSheet.tsx` (FR-022a)
- [X] T059 Envolver el panel con el estado de error dentro del destino que 006 ya provee, en `apps/frontend/src/components/class-schedule/ClassSchedulePanel.tsx`, dejando la barra viva y ofreciendo reintentar
- [X] T060 [P] Prueba en `apps/frontend/test/class-schedule-a11y.test.tsx`: toda acción de la sección se alcanza y se activa por teclado con foco visible, cada clase se anuncia con día, hora y categoría, y un rechazo lleva el foco al campo a corregir (FR-004a, FR-022a, FR-033, SC-006a)
- [X] T061 [P] Prueba en `apps/backend/test/wall-clock-time.test.ts`: las horas se manipulan como enteros de minutos de punta a punta y ninguna conversión de zona horaria las altera (FR-018a)
- [X] T062 Verificar en `apps/frontend/src/styles/class-schedule.css` la ausencia de desplazamiento horizontal desde 320 px y que la categoría se distingue por texto y forma, no solo por color (FR-004a, Principio VI)
- [X] T063 [P] Prueba en `apps/frontend/test/class-form-sheet-history.test.tsx`: con la hoja abierta, un `popstate` la cierra y deja a la persona en el destino, sin salir del entorno autenticado ni perder lo cargado (research.md §8)
- [X] T064 [P] Prueba en `apps/backend/test/weekly-recurrence.test.ts`: una clase no tiene ningún campo de fecha, de modo que rige todas las semanas por construcción y no existe forma de consultar la grilla de una fecha pasada (FR-007, FR-025a, SC-006, quickstart escenario 12)
- [ ] T065 Verificar con el escenario 8 de [quickstart.md](./quickstart.md) que crear, editar y configurar el horario se alcanzan en tres toques o menos desde la raíz del destino (FR-032, SC-004)
- [X] T066 Ejecutar `bun run lint`, `bun nx test backend`, `bun nx test frontend` y `bun run build`, todos en verde
- [ ] T067 Recorrer los catorce escenarios de [quickstart.md](./quickstart.md) con las cuentas de administrador e instructor

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T002 → T003 en secuencia (cadena de tipos); T004 → T005 en secuencia; T006 en paralelo con todo.
- **Foundational (Phase 2)**: depende de Phase 1. **Bloquea todas las historias.**
- **US1 (Phase 3)**: depende de Foundational. Es la única que puede empezar de inmediato. T028 y T029 van juntas: voltear el `status` sin conectar el panel deja el destino vacío, y conectarlo sin voltear el `status` no muestra nada.
- **US2 (Phase 4)**: depende de US1 — T037 modifica el caso de uso de creación que T021 crea, y T039 modifica el panel que T025 crea.
- **US3 (Phase 5)**: depende de US1 — extiende el formulario y la lista de clases. Independiente de US2.
- **US4 (Phase 6)**: depende de US1 (el panel debe existir para poder ocultar sus acciones). Independiente de US2 y US3.
- **Polish (Phase 7)**: T056 y T062 dependen de US1; T057 y T058 dependen de US2 y US3, que son las que traen los formularios.

### User Story Dependencies

- **US1 (P1)**: sin dependencias de otras historias.
- **US2 (P2)**: depende de US1. No es una historia independiente en el sentido estricto: un horario de apertura sin clases que acotar no se puede probar.
- **US3 (P2)**: depende de US1. Independiente de US2.
- **US4 (P3)**: depende de US1. Independiente de US2 y US3.

### Parallel Opportunities

- Phase 1: T006 en paralelo con toda la cadena de contratos y esquema.
- Phase 2: T008 y T010 en paralelo; T013 y T014 en paralelo; T017 una vez existe T008.
- Phase 3: T023 y T024 en paralelo entre sí; T030, T031 y T032 en paralelo una vez existen sus módulos.
- Phase 4: T040 y T041 en paralelo.
- Phase 5: T044 en paralelo con T043; T048 y T049 en paralelo.
- Phase 6: T053 y T054 en paralelo — una es de backend y otra de frontend, no compiten.
- Phase 7: T056, T060, T061, T063 y T064 en paralelo.
- Completada US1, las tres historias restantes pueden avanzar simultáneamente con equipo suficiente.

---

## Parallel Example: User Story 1

```bash
# Tras completar Foundational y T019–T022:
Task: "DaySelector en apps/frontend/src/components/class-schedule/DaySelector.tsx"      # T023
Task: "DayClassList en apps/frontend/src/components/class-schedule/DayClassList.tsx"    # T024

# Y una vez montado el panel, las tres pruebas juntas:
Task: "Solapamiento en apps/backend/test/class-overlap.test.ts"                         # T030
Task: "Panel en apps/frontend/test/class-schedule-panel.test.tsx"                       # T031
Task: "Selector en apps/frontend/test/day-selector.test.tsx"                            # T032
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1: Setup — contrato, esquema, migración.
2. Phase 2: Foundational — módulo, permisos, cliente. **Crítico: bloquea todo.**
3. Phase 3: US1 — ver y armar la grilla.
4. **PARAR Y VALIDAR**: escenarios 1 y 2 de quickstart con una cuenta administrador.
5. Desplegable: el destino "Horarios de clases" deja de estar en preparación y el skatepark puede
   cargar sus clases.

**Nota sobre el MVP**: US1 sola es un entregable real y honesto. Sin US2 las clases se crean sin
restricción de horario, que es un estado que la especificación contempla explícitamente (FR-018),
no un agujero.

### Incremental Delivery

1. Setup + Foundational → el módulo existe y responde.
2. + US1 → la grilla se ve y se carga. Validar y demostrar. **MVP.**
3. + US2 → el horario del skatepark acota las clases.
4. + US3 → la grilla se puede corregir sin rehacerla.
5. + US4 → el instructor consulta, y el servidor lo respalda.
6. + Polish → semana en columnas, accesibilidad, estado de error, cierre de calidad.

### Parallel Team Strategy

1. El equipo completa Setup, Foundational y US1 en conjunto: es la base y no se divide bien.
2. Con US1 terminada:
   - Persona A: US2 (horario del skatepark)
   - Persona B: US3 (editar y eliminar)
   - Persona C: US4 (solo lectura) más T056 y T061 de Polish
3. El resto de Polish al final: T057 y T058 tocan los formularios que A y B estuvieron escribiendo.

---

## Notes

- **El destino solo aparece si se hacen T028 y T029**. `renderDestination()` de 006 corta por
  `status` antes de consultar el mapa de paneles, así que cambiar solo el registro no tiene ningún
  efecto visible. Es el modo de fallo más silencioso de esta funcionalidad: todo compila, todas las
  pruebas pasan y la sección sigue diciendo "Sección en preparación".
- Los archivos de mayor contención son
  `apps/backend/src/modules/class-schedule/domain/services/schedule-rules.ts` (T008, T019, T034),
  `.../infrastructure/http/class-schedule.controller.ts` (T022, T036, T045),
  `apps/frontend/src/components/class-schedule/ClassSchedulePanel.tsx` (T025, T039, T051, T059) y
  `.../ClassFormSheet.tsx` (T026, T046, T057, T058): aparecen en varias fases y no admiten `[P]`
  entre sí.
- Contrato, backend y frontend deben quedar consistentes en el mismo PR, por el Development Workflow
  de la constitución.
- El caparazón de 006 no se toca salvo una línea en `destination-registry.tsx` (T029). El destino, su
  etiqueta, su orden y su dirección ya están fijados y no se reabren.
- Las horas son enteros de minutos en todo el sistema. La conversión a `"HH:MM"` ocurre únicamente
  en los formularios y al pintar: si aparece una cadena de hora o un `DateTime` en un contrato, en un
  caso de uso o en el repositorio, es un error (FR-018a, research.md §1).
- Commit por tarea o por grupo lógico; parar en cada checkpoint para validar la historia por
  separado.

---

## Estado de ejecución (2026-08-28)

**61 de 67 tareas completadas.** Las seis pendientes —T033, T042, T050, T055, T065 y T067— son
recorridos de [quickstart.md](./quickstart.md) en un navegador con las cuentas sembradas. No se
pueden ejecutar sin una persona frente a la pantalla, así que quedan sin marcar en lugar de darse
por hechas.

Lo que sí se verificó de forma automática, y contra el backend real corriendo:

| Regla | Cómo se comprobó |
|---|---|
| Solapamiento, aun con categorías distintas (FR-021) | Prueba de dominio + `POST` real devolviendo `overlap_conflict` con la clase en conflicto |
| Fuera del horario del día (FR-015) | Prueba de dominio + `POST` real devolviendo `outside_opening_hours` |
| Día cerrado (FR-015a) | Prueba de dominio + `POST` real devolviendo `day_closed` |
| Cambio de horario que dejaría clases afuera (FR-016) | `PUT` real devolviendo la lista de clases que lo impiden |
| Fin anterior al inicio (FR-019, FR-020) | Prueba de dominio + `POST` real devolviendo `invalid_input` |
| Permisos por rol (FR-026, FR-026a, FR-027) | Pruebas de las dos guardias + `curl` real: instructor lee 200, escribe 403 |
| Hora de reloj de pared (FR-018a) | El contrato rechaza cadenas y fechas; la validación no depende de `process.env.TZ` |
| Recurrencia sin historial (FR-007, FR-025a) | La forma del contrato no admite ningún campo de fecha |

**Validación ejecutada**: `biome check` sin errores; 87 pruebas de frontend y 38 de backend en
verde; `astro build` genera 15 páginas; `nest build` correcto.

**Nota sobre 006**: construir este destino dejó obsoletas dos aserciones de 006 que daban
"Horarios de clases" por sección en preparación. Se actualizaron —no se borraron—: la historia de
destinos sin construir la sostiene ahora "Reservar clases", que sigue siendo el único.

