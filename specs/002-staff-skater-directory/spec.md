# Feature Specification: Listado y Perfil de Skaters para Staff

**Feature Branch**: `002-staff-skater-directory`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Como usuario staff, quiero poder ver el listado de miembros (aka skaters). En el perfil de cada skater, quiero poder ver, nombre, apellido, apodo, edad, email, ultima vez que ingreso al establecimiento, afecciones de salud (que haya declarado), y si tiene, poder ver su foto. Tambien puedo editar el skater, pero solo los siguientes datos: apodo, foto, afecciones de salud."

## Clarifications

### Session 2026-08-20

- Q: Should both instructor and administrator roles have full view/edit access to a skater's declared health conditions, or should that specific data be restricted to administrators only? → A: Both roles have full access — instructors and administrators can both view and edit health conditions, since instructors directly supervise classes/free-skate sessions and need this information for safety.
- Q: What are the concrete limits for a skater's profile photo upload: allowed file types and maximum file size? → A: JPEG, PNG or WebP files, up to 5MB.

### Session 2026-08-21

- Q: Skater self-registration (feature 001, already implemented) only collects email and password — not name, last name, or birth date — but this profile feature assumes those already exist. Where should that data come from? → A: A separate, not-yet-specified future onboarding feature will collect name/last name/birth date once, after account creation; until a skater completes that step, this feature MUST show an explicit "incomplete profile" placeholder for those fields, following the same placeholder pattern already used for missing photo/health conditions/last check-in. Feature 001 is not reopened.
- Q: Does the who/when audit trail for health-condition edits (FR-014) need to be visible to staff in the UI, or is backend-only logging enough? → A: Backend-only — the system records who/when internally for audit/compliance purposes; no history view is required in the UI for this feature's scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el listado de skaters (Priority: P1)

Un usuario staff (instructor o administrador) accede a una vista que lista a todos los
skaters registrados en la plataforma, para poder ubicar rápidamente a cualquiera de ellos.

**Why this priority**: Es el punto de entrada a toda la gestión de skaters; sin el listado,
el staff no puede llegar al perfil de ningún skater.

**Independent Test**: Puede probarse por completo accediendo a la vista de listado con una
cuenta staff y verificando que se muestran los skaters registrados con datos suficientes para
identificarlos (nombre, apellido, apodo, foto si tiene).

**Acceptance Scenarios**:

1. **Given** un usuario staff autenticado, **When** accede a la vista de listado de skaters,
   **Then** el sistema muestra todos los skaters registrados con su nombre, apellido, apodo y
   foto (o un placeholder si no tiene).
2. **Given** un usuario staff en el listado, **When** busca a un skater por nombre o apodo,
   **Then** el sistema filtra el listado y muestra solo los skaters que coinciden.
3. **Given** un usuario con rol skater (no staff), **When** intenta acceder a la vista de
   listado de skaters, **Then** el sistema le niega el acceso.

---

### User Story 2 - Ver el perfil completo de un skater (Priority: P1)

Un usuario staff selecciona un skater desde el listado y accede a su perfil, donde puede ver
toda su información relevante: nombre, apellido, apodo, edad, email, última vez que ingresó al
establecimiento, afecciones de salud declaradas y su foto (si tiene).

**Why this priority**: Es el objetivo central de la funcionalidad: dar al staff visibilidad
completa de cada skater, incluyendo datos operativos (último ingreso) y de seguridad (salud).

**Independent Test**: Puede probarse por completo abriendo el perfil de un skater desde el
listado y verificando que se muestran todos los campos definidos, incluyendo los casos donde
algún dato no está disponible (sin foto, sin afecciones declaradas, sin ingresos registrados).

**Acceptance Scenarios**:

1. **Given** un skater con todos sus datos completos, **When** el staff abre su perfil,
   **Then** el sistema muestra nombre, apellido, apodo, edad, email, fecha del último ingreso
   al establecimiento, afecciones de salud declaradas y su foto.
2. **Given** un skater sin foto cargada, **When** el staff abre su perfil, **Then** el sistema
   muestra un estado/placeholder claro en lugar de un espacio vacío o un error.
3. **Given** un skater que no declaró afecciones de salud, **When** el staff abre su perfil,
   **Then** el sistema indica explícitamente que no hay afecciones declaradas.
4. **Given** un skater que nunca ingresó al establecimiento, **When** el staff abre su perfil,
   **Then** el sistema indica explícitamente que no hay ingresos registrados, en lugar de
   mostrar un campo vacío.
5. **Given** un skater cuyo nombre, apellido o fecha de nacimiento aún no fueron completados
   (perfil pendiente de una funcionalidad de onboarding fuera de este alcance), **When** el
   staff abre su perfil o lo ve en el listado, **Then** el sistema muestra un placeholder
   explícito de "perfil incompleto" para esos campos, en lugar de un espacio vacío.

---

### User Story 3 - Editar los datos habilitados del skater (Priority: P2)

Un usuario staff, desde el perfil de un skater, actualiza su apodo, su foto y/o sus afecciones
de salud declaradas, manteniendo esa información al día.

**Why this priority**: Es una capacidad de mantenimiento de datos secundaria a poder ver el
listado y el perfil (P1), pero necesaria para que la información se mantenga vigente (por
ejemplo, nuevas afecciones de salud informadas verbalmente por el skater).

**Independent Test**: Puede probarse por completo editando el apodo, la foto o las afecciones
de salud de un skater desde su perfil, guardando los cambios, y verificando que se reflejan
tanto en el perfil como en el listado (cuando corresponda, ej. apodo/foto).

**Acceptance Scenarios**:

1. **Given** un usuario staff en el perfil de un skater, **When** edita el apodo, la foto o las
   afecciones de salud y guarda, **Then** el sistema persiste los cambios y los refleja
   inmediatamente en el perfil.
2. **Given** un usuario staff en el perfil de un skater, **When** intenta modificar nombre,
   apellido, edad, email o el último ingreso, **Then** el sistema no lo permite: estos campos
   se muestran como solo lectura y cualquier intento de modificarlos (incluso fuera de la
   interfaz visible) es rechazado.
3. **Given** un usuario staff que actualiza el apodo o la foto de un skater, **When** el
   cambio se guarda, **Then** el listado de skaters también refleja el nuevo apodo/foto.

---

### Edge Cases

- Un usuario con rol skater (no staff) que intenta acceder al listado o al perfil de otro
  skater ve el acceso denegado, tal como en cualquier otra vista restringida a staff.
- Un skater cuya cuenta está desactivada (ver especificación de login) sigue apareciendo en el
  listado para el staff, mostrando su estado como desactivado, ya que el staff necesita poder
  ubicarlo igualmente para gestión administrativa.
- Si dos usuarios staff editan el mismo skater al mismo tiempo, la última edición guardada es
  la que prevalece (sin bloqueo de edición concurrente).
- Si la foto que el staff intenta subir no es JPEG, PNG o WebP, o supera los 5MB, el sistema
  rechaza la subida e indica el motivo, conservando la foto anterior (si existía).
- Si el staff borra el texto de afecciones de salud y guarda, el perfil pasa a mostrar el
  estado "sin afecciones declaradas".
- Un skater cuyo nombre, apellido o fecha de nacimiento aún no fueron completados (pendiente
  de una funcionalidad futura de onboarding, fuera de este alcance; el registro actual —
  001-user-login-sso — solo recolecta email y contraseña) se muestra con un placeholder
  explícito de "perfil incompleto" para esos campos, tanto en el listado como en el perfil
  (ver FR-015).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir a un usuario con rol staff (instructor o administrador)
  ver un listado de todos los skaters registrados en la plataforma.
- **FR-002**: El listado DEBE mostrar, como mínimo, nombre, apellido, apodo y foto (o un
  placeholder si no tiene) de cada skater, para permitir identificarlo rápidamente.
- **FR-003**: El sistema DEBE permitir al staff buscar/filtrar el listado por nombre, apellido
  o apodo.
- **FR-004**: El sistema DEBE permitir al staff abrir el perfil completo de cualquier skater
  desde el listado.
- **FR-005**: El perfil de un skater DEBE mostrar: nombre, apellido, apodo, edad, email, fecha
  del último ingreso al establecimiento, afecciones de salud declaradas y su foto.
- **FR-006**: Si el skater no tiene foto cargada, el sistema DEBE mostrar un estado/placeholder
  explícito en su lugar.
- **FR-007**: Si el skater no declaró afecciones de salud, el sistema DEBE indicarlo
  explícitamente ("sin afecciones declaradas") en lugar de mostrar un campo vacío.
- **FR-008**: Si el skater nunca registró un ingreso al establecimiento, el sistema DEBE
  indicarlo explícitamente ("sin ingresos registrados") en lugar de mostrar un campo vacío.
- **FR-009**: El sistema DEBE permitir al staff editar únicamente el apodo, la foto y las
  afecciones de salud declaradas de un skater desde su perfil.
- **FR-010**: El sistema DEBE impedir que el staff edite nombre, apellido, edad, email o el
  último ingreso al establecimiento desde esta funcionalidad, tanto en la interfaz como en
  cualquier vía de acceso directo a la operación de edición.
- **FR-011**: El sistema DEBE persistir los cambios de apodo, foto y afecciones de salud, y
  reflejarlos en el perfil del skater inmediatamente después de guardarlos, así como en el
  listado cuando el dato editado (apodo/foto) también se muestra allí.
- **FR-012**: El sistema DEBE restringir el acceso al listado y al perfil de skaters
  exclusivamente a usuarios con rol staff (instructor o administrador); un usuario con rol
  skater NO DEBE poder acceder a esta funcionalidad, ni siquiera para ver su propio perfil a
  través de ella. Entre los roles de staff, instructor y administrador tienen el mismo nivel de
  acceso a todos los campos del perfil, incluidas las afecciones de salud declaradas: no hay
  restricción adicional de visibilidad o edición entre ambos roles.
- **FR-013**: El sistema DEBE validar que la foto subida sea un archivo JPEG, PNG o WebP de
  hasta 5MB, rechazando la subida con un mensaje claro en caso contrario (formato no admitido o
  archivo demasiado grande) y conservando la foto previa.
- **FR-014**: El sistema DEBE registrar internamente (backend, para auditoría/compliance) quién
  y cuándo modificó las afecciones de salud declaradas de un skater, dado el carácter sensible
  de ese dato; esta funcionalidad NO requiere exponer ese historial en una vista para el staff.
- **FR-015**: Si el nombre, apellido o fecha de nacimiento de un skater aún no fueron
  completados (perfil pendiente de una funcionalidad de onboarding fuera de este alcance), el
  sistema DEBE mostrar un placeholder explícito de "perfil incompleto" para esos campos, tanto
  en el listado como en el perfil, en lugar de un espacio vacío o un error.

### Key Entities

- **Perfil de skater**: Extiende la cuenta de usuario (rol skater) con los datos relevantes
  para el staff: nombre, apellido, apodo, fecha de nacimiento (de la cual se deriva la edad),
  email, afecciones de salud declaradas, y foto de perfil. El apodo, la foto y las afecciones
  de salud son editables por staff; el resto de los datos de este perfil son de solo lectura
  desde esta funcionalidad.
- **Registro de ingreso**: Representa un evento de ingreso de un skater al establecimiento.
  Atributos clave: skater asociado, fecha y hora. Esta funcionalidad solo consume el ingreso
  más reciente por skater; la creación de estos registros pertenece a otra funcionalidad (por
  ejemplo, control de acceso/check-in), fuera del alcance de esta especificación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario staff puede encontrar un skater específico en el listado (usando
  búsqueda) y abrir su perfil completo en menos de 15 segundos.
- **SC-002**: El 100% de los perfiles de skaters se muestran correctamente sin errores visuales
  o campos rotos, tengan o no foto, afecciones de salud declaradas, o ingresos registrados.
- **SC-003**: Un cambio de apodo, foto o afecciones de salud realizado por staff se refleja en
  el perfil del skater sin necesidad de que el usuario recargue manualmente la página o
  reingrese a la vista.
- **SC-004**: El 100% de los intentos de un usuario con rol skater de acceder al listado o al
  perfil de otros skaters mediante esta funcionalidad son bloqueados.
- **SC-005**: El 100% de los intentos de editar campos no habilitados (nombre, apellido, edad,
  email, último ingreso) a través de esta funcionalidad son rechazados por el sistema.

## Assumptions

- "Staff" agrupa a los roles instructor y administrador (rol distinto de skater, el miembro
  estándar que asiste a la pista o a clases); ambos roles tienen acceso equivalente a esta
  funcionalidad, incluida la visibilidad y edición de afecciones de salud (confirmado en
  Clarifications). El administrador, además, tiene permisos adicionales fuera de esta
  funcionalidad (por ejemplo, cargar nuevos instructores; ver 003-instructor-role-assignment),
  pero eso no cambia el acceso equivalente entre ambos roles dentro de esta especificación.
- El email ya existe en el sistema desde el registro (001-user-login-sso, ya implementado).
  Nombre, apellido y fecha de nacimiento/edad NO son recolectados por ese registro (que solo
  pide email y contraseña); esta especificación asume que una funcionalidad futura de
  onboarding/completar-perfil, fuera de este alcance, los recolectará. Hasta que un skater
  complete ese paso, esos campos se muestran como "perfil incompleto" (ver FR-015). Esta
  especificación se limita a mostrar esos datos y, para los campos habilitados, editarlos.
- El "último ingreso al establecimiento" proviene de un registro de control de acceso/check-in
  gestionado por otra funcionalidad; esta especificación solo consume y muestra ese dato, no
  define cómo se genera.
- Las afecciones de salud declaradas se almacenan como texto libre (por ejemplo, alergias,
  condiciones médicas relevantes) declarado originalmente por el skater o por quien lo
  inscribió; esta especificación cubre su visualización y edición por staff, no su
  recolección inicial.
- El listado de skaters admite una cantidad de registros consistente con un skatepark (decenas
  a pocos miles de registros); se asume paginación o scroll estándar para mantener la vista
  utilizable a esa escala, sin requerimientos de rendimiento a gran escala (millones de
  registros).
- No se requiere un flujo de aprobación adicional para los cambios de apodo/foto/afecciones de
  salud: cualquier usuario staff puede guardarlos directamente, dado que el propio staff es
  quien interactúa presencialmente con los skaters en el establecimiento.
