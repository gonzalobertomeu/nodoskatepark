# Feature Specification: Listado de Staff

**Feature Branch**: `005-staff-directory`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Listado de staff: funcionalidad que permite a un administrador ver un listado de todos los usuarios con rol staff (instructor y administrador) de la plataforma — nombre, apellido, email y rol de cada uno. Surge como necesidad identificada durante el desarrollo de 003-instructor-role-assignment: esa feature permite promover skaters a instructor o invitar por email, pero no existe ninguna forma de ver quiénes son actualmente instructor o administrador. Es análoga a 002-staff-skater-directory (que lista skaters para staff), pero esta vez lista al staff mismo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el listado completo de staff (Priority: P1)

Un administrador abre la funcionalidad y ve, de un vistazo, a todas las personas que actualmente
tienen rol instructor o administrador en la plataforma: su nombre, apellido, email y rol.

**Why this priority**: Es la necesidad central que motiva esta feature — hoy no existe ninguna
forma de ver quiénes son instructor o administrador; 003-instructor-role-assignment permite
otorgar el rol pero no consultarlo. Sin esto, un administrador no puede verificar el resultado de
sus propias promociones/invitaciones ni conocer al resto del equipo.

**Independent Test**: Puede probarse por completo abriendo el listado como administrador y
verificando que aparecen exactamente las cuentas con rol instructor o administrador (con sus
datos), y ninguna cuenta con rol skater.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado y varias cuentas con rol instructor y administrador
   existentes, **When** abre el listado de staff, **Then** el sistema muestra nombre, apellido,
   email y rol de cada una.
2. **Given** el listado de staff, **When** se lo compara con las cuentas existentes en la
   plataforma, **Then** ninguna cuenta con rol skater aparece en él.
3. **Given** una cuenta staff que fue promovida recientemente y todavía no completó datos de
   perfil (nombre/apellido vacíos, ya que ese paso es exclusivo del flujo de onboarding de
   skaters), **When** aparece en el listado, **Then** el sistema la muestra con una indicación de
   "perfil incompleto" en lugar de un espacio en blanco.
4. **Given** una cuenta staff desactivada, **When** aparece en el listado, **Then** el sistema la
   muestra igualmente, marcada como desactivada.

---

### User Story 2 - Buscar un miembro de staff específico (Priority: P2)

Dentro del listado, un administrador busca a una persona puntual del staff por nombre, apellido o
email, sin tener que recorrer manualmente toda la lista.

**Why this priority**: Es secundaria a que el listado exista y funcione (P1), pero se vuelve
necesaria a medida que crece la cantidad de instructores — mirroring el mismo patrón ya validado
en 002-staff-skater-directory para el listado de skaters.

**Independent Test**: Puede probarse por completo cargando un término de búsqueda y verificando
que el listado se reduce a las cuentas staff cuyo nombre, apellido o email coinciden.

**Acceptance Scenarios**:

1. **Given** el listado de staff con varias cuentas, **When** el administrador escribe un término
   de búsqueda que coincide con el nombre, apellido o email de una cuenta staff, **Then** el
   listado se filtra para mostrar solo esa coincidencia (y otras que también coincidan).
2. **Given** un término de búsqueda que no coincide con ninguna cuenta staff, **When** se aplica,
   **Then** el sistema muestra un estado vacío en lugar de una lista en blanco sin explicación.

---

### Edge Cases

- Un administrador recién promovido (o invitado por email y luego registrado) sin nombre/apellido
  cargado aparece en el listado con la indicación "perfil incompleto" (ver User Story 1, escenario
  3), nunca con campos en blanco sin explicación.
- Ninguna cuenta con rol skater aparece en este listado bajo ninguna circunstancia, sin importar
  cuántas cuentas existan en la plataforma.
- Una cuenta staff desactivada sigue apareciendo en el listado (no se oculta), marcada como
  desactivada — mismo criterio que 002 aplica a skaters desactivados.
- Si en la plataforma solo existe la propia cuenta del administrador que consulta el listado (sin
  ningún instructor todavía), el listado muestra esa única cuenta, no un estado vacío.
- Una invitación de instructor pendiente (creada en 003-instructor-role-assignment, sin cuenta
  todavía) NO aparece en este listado — este listado muestra únicamente cuentas ya existentes, no
  invitaciones pendientes (esas ya son visibles en la propia pantalla de 003).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir a un administrador ver un listado de todas las cuentas con
  rol instructor o administrador de la plataforma.
- **FR-002**: El sistema DEBE mostrar, para cada cuenta del listado, su nombre, apellido, email y
  rol (instructor o administrador).
- **FR-003**: El listado NO DEBE incluir ninguna cuenta con rol skater, bajo ninguna
  circunstancia.
- **FR-004**: Si una cuenta staff todavía no tiene nombre/apellido cargado (porque ese dato solo
  se completa a través del flujo de onboarding exclusivo de skaters), el sistema DEBE mostrarla
  con una indicación explícita de "perfil incompleto" en lugar de dejar el campo vacío.
- **FR-005**: El sistema DEBE indicar, para cada cuenta del listado, si está activa o
  desactivada.
- **FR-006**: El sistema DEBE permitir a un administrador buscar dentro del listado por nombre,
  apellido o email, mostrando solo las cuentas staff que coincidan.
- **FR-007**: El sistema DEBE restringir el acceso a este listado exclusivamente a usuarios con
  rol administrador.
- **FR-008**: Esta funcionalidad es de solo lectura: el sistema NO DEBE permitir modificar el
  rol, el estado o los datos de perfil de ninguna cuenta staff desde este listado — otorgar o
  cambiar el rol instructor sigue siendo responsabilidad exclusiva de
  003-instructor-role-assignment.
- **FR-009**: El listado NO DEBE incluir invitaciones de instructor pendientes (cuentas todavía
  no creadas) — solo cuentas ya existentes con rol instructor o administrador.

### Key Entities

- **Cuenta de staff**: extiende la entidad Cuenta de usuario ya definida en especificaciones
  previas (001), filtrada a las cuentas cuyo rol es instructor o administrador. Atributos
  relevantes para este listado: nombre, apellido (pueden estar vacíos si la cuenta nunca completó
  el onboarding de perfil, algo exclusivo de skaters), email, rol, estado (activo/desactivado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador puede encontrar a un miembro específico del staff (por nombre o
  email) en menos de 15 segundos desde que abre el listado.
- **SC-002**: El 100% de las cuentas con rol instructor o administrador de la plataforma aparecen
  en el listado.
- **SC-003**: El 0% de las cuentas con rol skater aparece en el listado, en cualquier momento.
- **SC-004**: El 100% de las cuentas staff sin nombre/apellido cargado se muestran con la
  indicación "perfil incompleto", nunca con un campo en blanco sin explicación.

## Assumptions

- El acceso a este listado se restringe exclusivamente a administrador, tal como lo describe la
  entrada de esta especificación ("permite a un administrador ver..."), a diferencia de
  002-staff-skater-directory (que es de acceso staff-wide, incluyendo instructor). Si en el futuro
  se decide que instructor también debería poder verlo, será una ampliación de alcance explícita.
- El listado incluye una búsqueda por nombre/apellido/email, replicando el patrón ya validado en
  002-staff-skater-directory para su propio listado de skaters, en lugar de introducir un
  mecanismo de búsqueda nuevo.
- No se incluye una vista de detalle/perfil individual por cuenta staff (a diferencia de 002, que
  sí tiene una vista de perfil de skater) — la descripción de esta feature pide únicamente el
  listado con nombre, apellido, email y rol, sin mencionar edición ni detalle adicional.
- Modificar el rol, desactivar una cuenta, o editar datos de perfil de una cuenta staff quedan
  fuera de alcance de esta especificación — son operaciones de otras funcionalidades (algunas ya
  existentes, como 003 para otorgar el rol instructor; otras, como desactivar o editar perfil de
  staff, no existen todavía y quedarían para una especificación futura).
- Las invitaciones de instructor pendientes (003-instructor-role-assignment) no forman parte de
  este listado, ya que representan un email sin cuenta todavía, no una cuenta staff existente.
