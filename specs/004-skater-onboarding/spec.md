# Feature Specification: Onboarding de Datos Básicos del Skater

**Feature Branch**: `004-skater-onboarding`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Onboarding de skaters: funcionalidad que recolecta los datos base del perfil de un skater — nombre, apellido y fecha de nacimiento — que el registro actual (001-user-login-sso) no captura (solo pide email y contraseña). Surge como gap identificado durante /speckit-clarify de la feature 002-staff-skater-directory: el perfil de skater para staff asume que estos datos ya existen, pero ninguna funcionalidad existente los recolecta. Hasta que un skater complete este onboarding, 002 los muestra como "perfil incompleto" (placeholder). Esta nueva feature debe definir cómo y cuándo se completan esos datos."

## Clarifications

### Session 2026-08-21

- Q: ¿Quién completa el nombre, apellido y fecha de nacimiento del skater? → A: El propio skater, en autoservicio (no el staff), ya que el login de 001-user-login-sso es 100% autoservicio.
- Q: ¿Es obligatorio completar estos datos antes de usar la MainApp, o se puede omitir el paso? → A: Obligatorio — todo skater con perfil incompleto, sea una cuenta nueva o ya existente de antes de esta feature, queda bloqueado en el login hasta completarlo.
- Q: Una vez completados, ¿el skater puede editarlos él mismo más adelante, o quedan fijos? → A: Editables por el propio skater en cualquier momento posterior, desde su perfil en la MainApp.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Completar datos obligatorios al ingresar (Priority: P1)

Un skater cuyo perfil no tiene nombre, apellido o fecha de nacimiento completos (ya sea porque
se acaba de registrar o porque su cuenta es anterior a esta funcionalidad) inicia sesión
exitosamente por cualquier método (credenciales o Google) y, antes de llegar a la MainApp, el
sistema le pide completar esos datos.

**Why this priority**: Sin este paso, el perfil de skater que usa el staff (002) nunca deja de
mostrar el placeholder de "perfil incompleto", y ninguna otra funcionalidad del producto puede
asumir con confianza que esos datos existen. Es el único punto de entrada que garantiza que
todo skater, nuevo o preexistente, termine con un perfil completo.

**Independent Test**: Puede probarse por completo iniciando sesión con una cuenta de skater sin
nombre/apellido/fecha de nacimiento cargados, verificando que el sistema no permite llegar a la
MainApp sin completarlos, completando el formulario con datos válidos, y verificando que luego
sí se accede a la MainApp y que el perfil deja de estar "incompleto" para 002.

**Acceptance Scenarios**:

1. **Given** un skater cuyo perfil no tiene nombre, apellido ni fecha de nacimiento, **When**
   inicia sesión exitosamente con sus credenciales, **Then** el sistema le muestra un
   formulario para completar esos datos antes de dirigirlo a la MainApp.
2. **Given** un skater en el formulario de onboarding, **When** intenta continuar sin haber
   completado los tres campos, **Then** el sistema se lo impide e indica qué falta completar.
3. **Given** un skater en el formulario de onboarding, **When** completa nombre, apellido y una
   fecha de nacimiento válida y confirma, **Then** el sistema persiste los datos y lo dirige
   inmediatamente a la MainApp.
4. **Given** una cuenta de skater creada antes de que existiera esta funcionalidad (sin estos
   datos), **When** ese skater inicia sesión por primera vez después de que la funcionalidad
   está disponible, **Then** el sistema lo intercepta con el mismo formulario de onboarding, sin
   distinguir entre cuentas nuevas y preexistentes.
5. **Given** un skater que se autentica con Google por primera vez y no tiene estos datos
   cargados, **When** el login con Google se completa exitosamente, **Then** el sistema lo
   intercepta con el mismo formulario de onboarding, igual que a un skater que ingresó con
   credenciales.

---

### User Story 2 - Editar mis datos básicos más adelante (Priority: P2)

Un skater que ya completó su onboarding accede a su propio perfil desde la MainApp y corrige o
actualiza su nombre, apellido o fecha de nacimiento (por ejemplo, un error de tipeo).

**Why this priority**: Es una capacidad de mantenimiento de datos secundaria al onboarding
inicial (P1), pero necesaria para que el skater no dependa de un proceso administrativo para
corregir sus propios datos básicos.

**Independent Test**: Puede probarse por completo iniciando sesión con una cuenta de skater que
ya completó el onboarding, editando su nombre, apellido o fecha de nacimiento desde su perfil, y
verificando que el cambio se refleja inmediatamente ahí y en el perfil que ve el staff (002).

**Acceptance Scenarios**:

1. **Given** un skater con el onboarding ya completado, **When** accede a su propio perfil en la
   MainApp, **Then** el sistema le muestra su nombre, apellido y fecha de nacimiento actuales,
   editables.
2. **Given** un skater editando su propio nombre, apellido o fecha de nacimiento, **When**
   guarda un valor válido, **Then** el sistema persiste el cambio y lo refleja de inmediato en
   su propio perfil.
3. **Given** un skater editando su fecha de nacimiento, **When** intenta guardar un valor
   inválido (por ejemplo, una fecha futura), **Then** el sistema rechaza el cambio, indica el
   motivo y conserva el valor anterior.

---

### Edge Cases

- Si el skater completa solo algunos de los tres campos (por ejemplo, nombre y apellido pero no
  fecha de nacimiento) e intenta continuar, el perfil sigue considerándose incompleto y el
  sistema sigue exigiendo el o los campos faltantes (ver FR-003).
- Si el skater cierra el navegador o pierde el estado del formulario a mitad del onboarding sin
  haber confirmado, no se persiste ningún dato parcial; la próxima vez que inicie sesión, el
  sistema vuelve a presentarle el formulario completo desde cero.
- Si el skater tiene dos pestañas abiertas y completa el onboarding en una, la otra pestaña debe
  volver a verificar el estado del perfil (en vez de asumir que sigue incompleto) la próxima vez
  que intente avanzar hacia la MainApp.
- Una fecha de nacimiento futura, o que no corresponda a una edad realista, es rechazada con un
  mensaje claro tanto en el onboarding inicial como en una edición posterior (ver FR-005).
- Un usuario staff (instructor o administrador) nunca es interceptado por este onboarding: la
  funcionalidad aplica exclusivamente a cuentas con rol skater.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE detectar, en cada login exitoso de una cuenta con rol skater
  (por credenciales o por Google), si al perfil le falta nombre, apellido o fecha de
  nacimiento.
- **FR-002**: Si al perfil del skater le falta alguno de esos datos, el sistema DEBE
  presentarle un formulario de onboarding para completarlos antes de dirigirlo a la MainApp, sin
  importar si la cuenta es nueva o preexistente a esta funcionalidad.
- **FR-003**: El sistema NO DEBE permitir que el skater omita o avance más allá del formulario
  de onboarding mientras alguno de los tres campos (nombre, apellido, fecha de nacimiento) siga
  sin completarse.
- **FR-004**: El sistema DEBE persistir nombre, apellido y fecha de nacimiento inmediatamente
  al confirmarse el formulario de onboarding, y dirigir al skater a la MainApp a continuación.
- **FR-005**: El sistema DEBE validar que la fecha de nacimiento ingresada no sea futura y
  corresponda a una edad realista, rechazando valores inválidos con un mensaje claro, tanto en
  el onboarding inicial como en una edición posterior.
- **FR-006**: El sistema DEBE permitir a todo skater ver y editar su propio nombre, apellido y
  fecha de nacimiento en cualquier momento posterior al onboarding, desde su perfil en la
  MainApp.
- **FR-007**: El onboarding DEBE aplicarse de la misma forma sin importar el método de
  autenticación usado para iniciar sesión (credenciales o Google).
- **FR-008**: El sistema NO DEBE requerir ni presentar este onboarding a cuentas con rol staff
  (instructor o administrador); aplica exclusivamente a cuentas con rol skater.
- **FR-009**: El sistema NO DEBE persistir datos parciales del formulario de onboarding si el
  skater lo abandona sin confirmarlo; la próxima vez que inicie sesión, el sistema DEBE volver a
  presentarle el formulario completo.

### Key Entities

- **Datos básicos del skater**: nombre, apellido y fecha de nacimiento (de la cual se deriva la
  edad). Son atributos del mismo "Perfil de skater" ya referenciado por
  002-staff-skater-directory, no una entidad nueva. Antes de que los tres estén completos, el
  perfil se considera "incompleto"; una vez completos, dejan de mostrarse como placeholder en
  002 y quedan editables por el propio skater (a diferencia de otros campos de ese mismo
  perfil, como el email, que no forman parte de esta funcionalidad).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un skater con perfil incompleto completa el onboarding (nombre, apellido, fecha
  de nacimiento) y llega a la MainApp en menos de 2 minutos desde su login exitoso.
- **SC-002**: El 100% de los skaters con perfil incompleto — nuevos o preexistentes — son
  interceptados por el onboarding antes de llegar a la MainApp, sin excepciones.
- **SC-003**: El 100% de los intentos de un skater con perfil incompleto de llegar a la MainApp
  sin completar los tres campos obligatorios son bloqueados.
- **SC-004**: Un skater que edita su nombre, apellido o fecha de nacimiento ya completados ve el
  cambio reflejado en su propio perfil en menos de 5 segundos, sin pasos adicionales.

## Assumptions

- El nombre y el apellido se almacenan como texto libre, sin más validación que no estar
  vacíos, siguiendo el mismo criterio simple usado en 001-user-login-sso para otros campos de
  texto.
- No se define una edad mínima de admisión ni un proceso de consentimiento de tutores para
  skaters menores de edad; queda fuera del alcance de esta especificación (ver Edge Cases). Si
  el negocio requiere una política de edad mínima, debe definirse en una funcionalidad aparte.
- El sistema no intenta obtener automáticamente nombre/apellido desde el perfil de Google aunque
  estén disponibles ahí; todo skater completa este onboarding sin importar el método de login
  usado, para no depender de que Google siempre provea esos campos (ver FR-007).
- La MainApp referida es la misma definida en 001-user-login-sso; este onboarding se inserta
  como un paso obligatorio entre un login exitoso y el acceso a la MainApp, y solo aplica a
  cuentas con rol skater (ver FR-008).
- Esta funcionalidad completa el mismo "Perfil de skater" ya referenciado por
  002-staff-skater-directory: una vez que un skater completa su onboarding, 002 deja de
  mostrarlo con el placeholder de "perfil incompleto" para estos campos.
