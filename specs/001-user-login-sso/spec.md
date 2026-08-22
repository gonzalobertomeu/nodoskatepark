# Feature Specification: Login Principal con Credenciales, Recuperación y SSO de Google

**Feature Branch**: `001-user-login-sso`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Como usuario con cualquier rol, puedo entrar a la vista principal de login de la aplicacion. Alli puedo ingresar mis credenciales, recuperar mi constrasena o crear un nuevo usuario si soy nuevo en la plataforma. Puedo ingresar tambien con mi cuenta de google (SSO). Una vez validado y completado el flujo estandar de login, ingreso a la MainApp."

## Clarifications

### Session 2026-08-20

- Q: What should happen when a user whose account has been deactivated tries to log in, whether with credentials or with Google? → A: Reject the login attempt with a generic "account not available" message (no further detail), regardless of auth method.
- Q: If someone already has a password-based account and later tries "Sign in with Google" using that same email (or the reverse), should the system link it to the existing account or keep them separate? → A: Auto-link by email — same email always resolves to the same account regardless of method; a password signup on an email already linked to Google is blocked with a message directing the user to sign in with Google instead.
- Q: What exact throttling/lockout policy should apply after repeated failed login attempts on the same account? → A: After 5 consecutive failed attempts on the same account, block further login attempts on it for 15 minutes; the failed-attempt counter resets on a successful login.

### Session 2026-08-21

- Q: If a user closes the browser or loses flow state mid password-recovery or mid-registration, what should happen when they try again? → A: Password recovery resumes via the emailed link from any browser/session (the token lives server-side, not in browser state); registration, being a single-step form with no persisted intermediate state, simply restarts from scratch.
- Q: If a user who already has an active session reopens the login view (e.g., in a new tab), what should happen? → A: Redirect automatically to MainApp, without showing the login form.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar sesión con credenciales (Priority: P1)

Un usuario existente (sin importar su rol: administrador, instructor o skater) llega a la
vista principal de login, ingresa su email y contraseña, y accede a la MainApp una vez que sus
credenciales son validadas.

**Why this priority**: Es el flujo de entrada principal y más frecuente a la plataforma; sin
esto ningún usuario puede acceder al resto del sistema.

**Independent Test**: Puede probarse por completo ingresando un email y contraseña válidos de
una cuenta ya existente y verificando que el usuario llega a la MainApp; y por separado,
ingresando credenciales inválidas y verificando que el acceso se rechaza con un mensaje claro.

**Acceptance Scenarios**:

1. **Given** un usuario registrado con credenciales válidas, **When** ingresa su email y
   contraseña correctos en la vista de login, **Then** el sistema lo valida y lo lleva a la
   MainApp.
2. **Given** un usuario registrado, **When** ingresa una contraseña incorrecta, **Then** el
   sistema rechaza el acceso y muestra un mensaje de error sin indicar si el email existe o no.
3. **Given** un usuario que no existe en la plataforma, **When** intenta ingresar con ese email,
   **Then** el sistema rechaza el acceso con el mismo mensaje genérico que en el caso de
   contraseña incorrecta.

---

### User Story 2 - Iniciar sesión con Google (SSO) (Priority: P1)

Un usuario elige ingresar con su cuenta de Google desde la vista de login en lugar de escribir
credenciales, y accede a la MainApp una vez que Google confirma su identidad.

**Why this priority**: Es un método de acceso alternativo de primer nivel explícitamente
solicitado, que reduce fricción de login y es tan central como el login con credenciales.

**Independent Test**: Puede probarse por completo seleccionando la opción "Ingresar con
Google", completando el flujo de autenticación de Google con una cuenta válida, y verificando
que el usuario llega a la MainApp.

**Acceptance Scenarios**:

1. **Given** un usuario con una cuenta ya vinculada a Google, **When** selecciona "Ingresar con
   Google" y confirma su identidad en Google, **Then** el sistema lo autentica y lo lleva a la
   MainApp.
2. **Given** un usuario que cancela o rechaza la autenticación en la pantalla de Google,
   **When** regresa a la aplicación, **Then** permanece en la vista de login con un mensaje
   indicando que el inicio de sesión no se completó.

---

### User Story 3 - Recuperar contraseña olvidada (Priority: P2)

Un usuario que no recuerda su contraseña solicita recuperarla desde la vista de login,
recibe instrucciones para restablecerla, y luego puede ingresar con la nueva contraseña.

**Why this priority**: Es un flujo de soporte esencial para no bloquear el acceso de usuarios
existentes, pero depende de que el login con credenciales (P1) ya exista.

**Independent Test**: Puede probarse por completo solicitando la recuperación con un email
registrado, siguiendo el enlace/código recibido, definiendo una nueva contraseña, y
verificando que el usuario puede iniciar sesión con la nueva contraseña.

**Acceptance Scenarios**:

1. **Given** un usuario registrado que olvidó su contraseña, **When** solicita la recuperación
   ingresando su email, **Then** el sistema le envía instrucciones para restablecerla sin
   revelar si el email está o no registrado.
2. **Given** un usuario que recibió instrucciones de recuperación, **When** define una nueva
   contraseña válida siguiendo el enlace recibido, **Then** el sistema actualiza su contraseña
   y le permite iniciar sesión con la nueva.
3. **Given** un enlace de recuperación vencido o ya utilizado, **When** el usuario intenta
   usarlo, **Then** el sistema lo rechaza e indica que debe solicitar uno nuevo.

---

### User Story 4 - Crear una cuenta nueva (Priority: P2)

Un usuario nuevo en la plataforma, que aún no tiene cuenta, se registra desde la vista de
login proporcionando sus datos básicos, y queda en condiciones de iniciar sesión.

**Why this priority**: Habilita el crecimiento de la base de usuarios, pero es secundario al
acceso de usuarios ya existentes (P1) y depende de las mismas pantallas de login.

**Independent Test**: Puede probarse por completo completando el formulario de alta con datos
válidos y un email no utilizado previamente, y verificando que la cuenta queda creada y
disponible para iniciar sesión.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** completa el formulario de registro con un email
   no utilizado y una contraseña válida, **Then** el sistema crea la cuenta nueva.
2. **Given** un visitante que intenta registrarse, **When** ingresa un email que ya está
   registrado en la plataforma, **Then** el sistema rechaza el alta e informa que ese email ya
   está en uso, sin exponer datos de la cuenta existente.
3. **Given** un visitante que completa el registro, **When** el alta es exitosa, **Then** el
   sistema le indica claramente cómo continuar (iniciar sesión o, si aplica, verificar su
   email) antes de acceder a la MainApp.

---

### Edge Cases

- Tras 5 intentos fallidos consecutivos sobre la misma cuenta, el sistema bloquea nuevos
  intentos de login sobre esa cuenta durante 15 minutos; el contador de intentos fallidos se
  reinicia con un login exitoso (ver FR-015).
- Un usuario que se registró con email/contraseña y luego usa "Ingresar con Google" con el
  mismo email queda autenticado en su misma cuenta existente (vinculación automática por
  email); si en cambio intenta registrarse manualmente con un email ya vinculado a una cuenta
  de Google, el sistema rechaza el alta e indica que debe ingresar con Google (ver FR-017).
- Si el usuario cierra o pierde el estado del flujo a mitad de la recuperación de contraseña,
  puede retomarlo abriendo el enlace recibido por email en cualquier sesión o navegador, ya que
  el token vive en el servidor y no depende del estado del navegador; si lo pierde a mitad del
  registro, debe simplemente reiniciar el formulario desde cero, dado que no existe estado
  intermedio persistido entre pasos.
- Un usuario que ya tiene una sesión activa y vuelve a abrir la vista de login (por ejemplo,
  en una pestaña nueva) es redirigido automáticamente a la MainApp, sin que se le muestre el
  formulario de login (ver FR-018).
- Un usuario cuya cuenta fue desactivada/dada de baja por un administrador recibe, al intentar
  iniciar sesión por cualquier método, un mensaje genérico de "cuenta no disponible" que no
  revela el motivo de la desactivación (ver FR-016).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar una vista principal de login como punto de entrada único
  de la aplicación, accesible para usuarios de cualquier rol.
- **FR-002**: El sistema DEBE permitir a un usuario existente iniciar sesión ingresando email y
  contraseña.
- **FR-003**: El sistema DEBE validar las credenciales ingresadas y, si son correctas, dirigir
  al usuario a la MainApp; si son incorrectas, DEBE rechazar el acceso con un mensaje de error
  genérico que no revele si el email existe en la plataforma.
- **FR-004**: El sistema DEBE ofrecer una opción de "Ingresar con Google" (SSO) desde la vista
  de login como alternativa al ingreso con email y contraseña.
- **FR-005**: El sistema DEBE, tras una autenticación exitosa vía Google, identificar al
  usuario correspondiente y dirigirlo a la MainApp de la misma forma que un login exitoso con
  credenciales.
- **FR-006**: El sistema DEBE permitir a un usuario solicitar la recuperación de su contraseña
  desde la vista de login, ingresando su email.
- **FR-007**: El sistema DEBE enviar al usuario instrucciones para restablecer su contraseña
  sin revelar si el email ingresado corresponde o no a una cuenta existente.
- **FR-008**: El sistema DEBE permitir definir una nueva contraseña a partir de un enlace o
  código de recuperación válido y no vencido, e invalidar dicho enlace/código después de
  usarlo o tras su vencimiento.
- **FR-009**: El sistema DEBE permitir a un usuario nuevo crear una cuenta desde la vista de
  login, proporcionando al menos email y contraseña.
- **FR-010**: El sistema DEBE impedir el registro de una cuenta nueva con un email ya
  utilizado por otra cuenta existente, informando el conflicto sin exponer datos de la cuenta
  existente.
- **FR-011**: El sistema DEBE asignar a toda cuenta creada por auto-registro (email/contraseña
  o primer ingreso vía Google) el rol de **skater**; cualquier rol distinto a skater
  (instructor, administrador) DEBE ser asignado exclusivamente por un administrador desde fuera
  de este flujo de login.
- **FR-012**: Cuando un usuario se autentica con Google y no existe una cuenta previa asociada
  a ese email, el sistema DEBE crear automáticamente una cuenta nueva con rol de skater,
  aplicando las mismas reglas de unicidad de email que el registro manual (FR-010).
- **FR-013**: El sistema DEBE exigir la verificación del email antes de habilitar el primer
  inicio de sesión de una cuenta creada por registro manual (email/contraseña); las cuentas
  creadas vía Google se consideran con email verificado por Google.
- **FR-014**: El sistema DEBE mantener la sesión del usuario luego de un login exitoso (por
  cualquiera de los métodos) hasta que el usuario cierre sesión o la sesión expire.
- **FR-015**: El sistema DEBE registrar los intentos de login fallidos y, tras 5 intentos
  fallidos consecutivos sobre una misma cuenta, DEBE bloquear nuevos intentos de login sobre
  esa cuenta durante 15 minutos para mitigar ataques de fuerza bruta; el contador de intentos
  fallidos DEBE reiniciarse tras un login exitoso.
- **FR-016**: El sistema DEBE rechazar todo intento de login sobre una cuenta desactivada, por
  cualquier método de autenticación (credenciales o Google), con un mensaje genérico de
  "cuenta no disponible" que no revele el motivo de la desactivación.
- **FR-017**: El sistema DEBE vincular automáticamente por email los métodos de autenticación
  de una misma persona: si el email de una cuenta de Google coincide con el email de una
  cuenta ya registrada por contraseña, el sistema DEBE autenticar al usuario en esa cuenta
  existente en lugar de crear una cuenta duplicada. Un intento de registro manual
  (email/contraseña) sobre un email ya vinculado a una cuenta de Google DEBE rechazarse,
  indicando al usuario que debe ingresar con Google.
- **FR-018**: El sistema DEBE redirigir automáticamente a la MainApp, sin mostrar el
  formulario de login, a todo usuario que acceda a la vista de login mientras ya tiene una
  sesión activa válida.

### Key Entities

- **Cuenta de usuario**: Representa a una persona con acceso a la plataforma. Atributos clave:
  email (único), contraseña (si aplica), rol (skater, instructor, administrador), estado
  (activa/desactivada), estado de verificación de email, método(s) de autenticación asociados
  (contraseña propia y/o Google).
- **Solicitud de recuperación de contraseña**: Representa un pedido de restablecimiento de
  contraseña. Atributos clave: cuenta asociada, enlace/código de un solo uso, fecha de
  expiración, estado (pendiente/usado/vencido).
- **Sesión**: Representa el acceso autenticado activo de un usuario a la MainApp. Atributos
  clave: cuenta asociada, método de login utilizado, fecha de inicio, fecha de expiración.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con credenciales válidas puede completar el inicio de sesión (desde
  que abre la vista de login hasta llegar a la MainApp) en menos de 30 segundos.
- **SC-002**: Un usuario puede iniciar sesión con su cuenta de Google en menos de 3 pasos de
  interacción (seleccionar la opción, confirmar la cuenta de Google, llegar a la MainApp).
- **SC-003**: Al menos el 95% de los intentos de login con credenciales correctas resultan en
  acceso exitoso a la MainApp sin errores del sistema.
- **SC-004**: Un usuario que solicita recuperar su contraseña puede definir una nueva
  contraseña y volver a iniciar sesión exitosamente en menos de 5 minutos desde que recibe las
  instrucciones.
- **SC-005**: Un usuario nuevo puede completar el registro de cuenta y quedar en condiciones de
  iniciar sesión en menos de 2 minutos.
- **SC-006**: El 100% de los intentos de acceso con credenciales inválidas o inexistentes son
  rechazados sin revelar si el email está o no registrado en la plataforma.

## Assumptions

- La vista de login es común a todos los roles (skater, instructor, administrador); el
  contenido específico que cada rol ve dentro de la MainApp está fuera del alcance de esta
  especificación. "Skater" es el rol estándar (miembro que asiste a la pista o a clases);
  instructor y administrador son colectivamente "staff" y comparten acceso a una app de
  administración con distinta jerarquía de permisos (ver 003-instructor-role-assignment).
- El auto-registro (por credenciales o primer ingreso con Google) siempre asigna el rol de
  skater; la asignación de roles de instructor o administrador es un proceso administrativo
  separado, fuera del alcance de esta especificación (ver 003-instructor-role-assignment).
- Las cuentas registradas manualmente requieren verificación de email antes del primer login;
  las cuentas creadas vía Google se consideran verificadas automáticamente.
- La MainApp referida en la descripción es la aplicación autenticada existente/planeada del
  proyecto; esta especificación cubre únicamente el flujo hasta el punto de entrada a la
  MainApp, no su contenido interno.
- Se asume una política de contraseña y expiración de sesión estándar de la industria para
  aplicaciones web, a definir en detalle durante la fase de planificación.
