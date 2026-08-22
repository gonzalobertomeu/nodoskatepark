# Feature Specification: Asignación del Rol de Instructor por un Administrador

**Feature Branch**: `003-instructor-role-assignment`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Como administrador, quiero poder cargar a los otros profes del establecimiento (aka instructores). Puedo, seleccionar un usuario previamente creado (que por defecto tiene rol skater), o cargar un email, y en el momento que se crea el usuario con el mismo mail, ya se le carga dicho rol de instructor. Un usuario administrador o instructor ya no puede poseer el rol skater. Son excluyentes. El rol administrador y instructor, son considerados staff, y tienen el acceso a la misma "app" de administracion pero con distinta jerarquia de permisos."

## Clarifications

### Session 2026-08-20

- Q: Should the system keep an audit trail of instructor-role grants — recording which administrator granted the role, to whom, and when? → A: Yes, audit every grant — record the admin, target account/email, method (existing user vs. email invite), and timestamp for every instructor-role assignment.

### Session 2026-08-22

- Q: FR-001 says the administrator picks the future instructor from "the existing users listing," reusing 002-staff-skater-directory's listing per the Assumptions — but that listing (already implemented) is hard-scoped to skater-role accounts only; it never shows instructor or administrador accounts. Yet User Story 1's Acceptance Scenario 3 and the Edge Cases describe an administrator attempting to assign the instructor role to someone who is already instructor or administrador. How is this reconciled? → A: Reuse 002's existing skater-only listing exactly as-is, with no changes to it. The "already instructor"/"already administrador" guards (FR-007, FR-008, Scenario 3) remain real backend checks — verified independent of how the request reaches the server — but under normal UI browsing they are unreachable, since the picker structurally never surfaces a non-skater account to begin with.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Promover a instructor a un usuario ya registrado (Priority: P1)

Un administrador busca a una persona que ya tiene cuenta en la plataforma (con el rol skater
por defecto) y la promueve al rol instructor.

**Why this priority**: Es el caso más común: la mayoría de los profes ya se anotó como skater
antes de que el establecimiento formalice su rol de instructor.

**Independent Test**: Puede probarse por completo seleccionando a un skater existente desde el
listado, asignándole el rol instructor, y verificando que su rol pasa a instructor (dejando de
ser skater) y que puede acceder a la app de administración.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado y un usuario existente con rol skater, **When** el
   administrador lo selecciona y confirma la asignación del rol instructor, **Then** el
   sistema cambia su rol a instructor y ya no lo considera skater.
2. **Given** un usuario recién promovido a instructor, **When** inicia sesión, **Then** accede
   a la app de administración (la misma que usan los administradores) con los permisos
   correspondientes a su rol.
3. **Given** un administrador, **When** intenta asignar el rol instructor a un usuario que ya
   es administrador, **Then** el sistema no realiza el cambio e informa que ese usuario ya
   tiene un rol de staff de mayor jerarquía.

---

### User Story 2 - Invitar como instructor a alguien sin cuenta todavía (Priority: P1)

Un administrador carga el email de un futuro profe que todavía no tiene cuenta en la
plataforma; cuando esa persona se registra con ese mismo email, su cuenta se crea
automáticamente con el rol instructor en lugar del rol skater por defecto.

**Why this priority**: Es tan central como promover a un usuario existente: el administrador
necesita poder reservar el rol de un profe nuevo antes de que esa persona haya pasado por el
flujo de login/registro.

**Independent Test**: Puede probarse por completo cargando un email sin cuenta asociada,
completando luego el registro con ese mismo email a través del flujo estándar de login, y
verificando que la cuenta resultante tiene el rol instructor y no skater.

**Acceptance Scenarios**:

1. **Given** un administrador y un email sin cuenta asociada en la plataforma, **When** el
   administrador carga ese email para asignarle el rol instructor, **Then** el sistema registra
   una invitación de instructor pendiente para ese email.
2. **Given** una invitación de instructor pendiente para un email, **When** una persona se
   registra en la plataforma con ese mismo email (por cualquier método de login estándar),
   **Then** la cuenta se crea con el rol instructor en lugar del rol skater por defecto, y la
   invitación pendiente queda resuelta.
3. **Given** un administrador, **When** carga un email que ya pertenece a una cuenta existente
   en lugar de seleccionarla desde el listado, **Then** el sistema asigna el rol instructor
   directamente a esa cuenta existente, sin crear una invitación pendiente redundante.

---

### User Story 3 - Cancelar una invitación de instructor pendiente (Priority: P2)

Un administrador revisa las invitaciones de instructor pendientes y cancela una que ya no
corresponde (por ejemplo, un email cargado por error).

**Why this priority**: Es una capacidad de corrección necesaria para que un error de tipeo o un
cambio de planes no deje una invitación pendiente indefinidamente, pero es secundaria a poder
crear las invitaciones (P1).

**Independent Test**: Puede probarse por completo creando una invitación pendiente,
cancelándola antes de que la persona invitada se registre, y verificando que un registro
posterior con ese email ya no recibe el rol instructor automáticamente.

**Acceptance Scenarios**:

1. **Given** una invitación de instructor pendiente, **When** el administrador la cancela,
   **Then** el sistema la marca como cancelada y deja de aplicarla a futuros registros con ese
   email.
2. **Given** una invitación de instructor pendiente ya cancelada, **When** alguien se registra
   con ese email, **Then** la cuenta se crea con el rol skater por defecto, como si nunca
   hubiera existido la invitación.

---

### Edge Cases

- Un administrador intenta asignar el rol instructor a un usuario que ya es instructor: el
  sistema no realiza cambios e informa que ya tiene ese rol.
- Un administrador intenta asignar el rol instructor a un usuario que ya es administrador: el
  sistema lo rechaza (ver User Story 1, escenario 3).
- Un administrador carga un email para el que ya existe una invitación de instructor
  pendiente: el sistema no crea una segunda invitación y muestra el estado de la existente.
- Un administrador carga un email con formato inválido: el sistema rechaza la carga antes de
  crear la invitación.
- Una invitación de instructor pendiente nunca es consumida porque la persona nunca se
  registra: la invitación permanece pendiente indefinidamente hasta que un administrador la
  cancele.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir a un administrador buscar y seleccionar, desde el
  listado de usuarios existentes, a cualquier usuario con rol skater para asignarle el rol
  instructor. Este listado es el mismo listado de skaters ya definido en
  002-staff-skater-directory, reutilizado sin modificaciones: por diseño, nunca muestra cuentas
  con rol instructor o administrador (ver Clarifications).
- **FR-002**: Al asignar el rol instructor a un usuario existente, el sistema DEBE cambiar su
  rol de skater a instructor de forma inmediata, dejando de considerarlo skater.
- **FR-003**: El sistema DEBE permitir a un administrador registrar una invitación de
  instructor pendiente asociada a un email que no tiene cuenta creada en la plataforma.
- **FR-004**: Cuando se crea una cuenta nueva (por cualquier método de login estándar) con un
  email que tiene una invitación de instructor pendiente, el sistema DEBE asignar el rol
  instructor a esa cuenta en el momento de su creación, en lugar del rol skater por defecto, y
  DEBE marcar la invitación como resuelta.
- **FR-005**: El sistema DEBE garantizar que los roles skater, instructor y administrador son
  mutuamente excluyentes: toda cuenta DEBE tener exactamente uno de estos tres roles en todo
  momento.
- **FR-006**: El sistema DEBE restringir la capacidad de asignar el rol instructor (tanto sobre
  un usuario existente como mediante una invitación por email) exclusivamente a usuarios con
  rol administrador.
- **FR-007**: El sistema DEBE impedir que se asigne el rol instructor, a través de esta
  funcionalidad, a un usuario que ya posee el rol administrador. Esta validación se aplica en
  el backend, independientemente del origen del pedido: el listado normal de la interfaz
  (FR-001) nunca muestra cuentas administrador, por lo que en el uso normal esta protección
  actúa como una segunda barrera, no como el único mecanismo (ver Clarifications).
- **FR-008**: El sistema DEBE tratar el intento de asignar el rol instructor a un usuario que
  ya es instructor como una operación sin efecto, informando al administrador el estado actual
  en lugar de generar un error. Igual que FR-007, esta validación es una barrera de backend; el
  listado normal de la interfaz (FR-001) nunca muestra cuentas instructor (ver Clarifications).
- **FR-009**: El sistema DEBE impedir crear una invitación de instructor pendiente duplicada
  para un email que ya tiene una invitación pendiente, informando al administrador de la
  invitación existente.
- **FR-010**: Si el administrador carga un email que ya pertenece a una cuenta existente, el
  sistema DEBE asignar el rol instructor directamente a esa cuenta en lugar de crear una
  invitación pendiente.
- **FR-011**: El sistema DEBE permitir a un administrador ver y cancelar una invitación de
  instructor pendiente antes de que sea consumida por la creación de una cuenta.
- **FR-012**: El sistema DEBE validar que el email cargado para una invitación de instructor
  tenga un formato de email válido antes de aceptarla.
- **FR-013**: Los roles administrador e instructor DEBEN considerarse ambos "staff" y DEBEN
  tener acceso a la misma aplicación de administración, diferenciándose únicamente en el nivel
  de permisos dentro de ella; los usuarios con rol skater NO DEBEN tener acceso a dicha
  aplicación.
- **FR-014**: El sistema DEBE registrar en una bitácora de auditoría cada asignación del rol
  instructor, incluyendo qué administrador la realizó, sobre qué cuenta o email, por qué medio
  (selección de usuario existente o invitación por email) y en qué momento.

### Key Entities

- **Cuenta de usuario** (extiende la entidad definida en especificaciones previas): su rol es
  un único valor excluyente entre skater, instructor y administrador. Un cambio de rol
  reemplaza el valor anterior; no se admite más de un rol simultáneo.
- **Invitación de instructor pendiente**: representa la reserva del rol instructor para un
  email que todavía no tiene cuenta. Atributos clave: email, administrador que la creó, fecha
  de creación, estado (pendiente / cancelada / resuelta).
- **Registro de auditoría de asignación de rol**: representa cada otorgamiento del rol
  instructor. Atributos clave: administrador que lo realizó, cuenta o email destino, método
  (usuario existente o invitación por email), fecha y hora.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador puede promover a instructor a un usuario ya registrado en menos
  de 30 segundos desde que lo encuentra en el listado.
- **SC-002**: Un administrador puede crear una invitación de instructor por email en menos de
  30 segundos.
- **SC-003**: El 100% de las cuentas creadas con un email que tenía una invitación de
  instructor pendiente (y no cancelada) reciben el rol instructor automáticamente, sin
  intervención manual adicional al momento del registro.
- **SC-004**: El 100% de los intentos de un usuario con rol skater o instructor de asignar el
  rol instructor a otra cuenta son bloqueados.
- **SC-005**: En todo momento, el 100% de las cuentas de la plataforma tienen exactamente uno
  de los tres roles (skater, instructor, administrador); ninguna cuenta queda sin rol ni con
  más de uno.

## Assumptions

- El rol "skater" de esta especificación corresponde al rol "miembro" usado en
  especificaciones previas (001-user-login-sso, 002-staff-skater-directory); se adopta aquí la
  terminología "skater" por ser la usada explícitamente en esta descripción, y se recomienda
  unificar el nombre del rol en el resto de las especificaciones más adelante.
- Esta funcionalidad cubre únicamente el otorgamiento del rol instructor. Revertir un
  instructor a skater, degradar a un administrador, o crear nuevas cuentas administrador, son
  operaciones fuera de alcance de esta especificación (se asume que serán una funcionalidad de
  gestión de roles separada).
- Una invitación de instructor pendiente no vence ni genera una notificación automática a la
  persona invitada; el rol simplemente se aplica en silencio si y cuando esa persona completa
  el registro con ese email.
- La selección de "un usuario previamente creado" reutiliza el mismo listado/búsqueda de
  usuarios ya definido para el staff (ver 002-staff-skater-directory), en lugar de introducir
  un mecanismo de búsqueda nuevo.
- Las diferencias exactas de permisos entre administrador e instructor dentro de la app de
  administración compartida se definen en cada funcionalidad específica que los use; esta
  especificación solo establece que ambos acceden a esa app y que skater no.
