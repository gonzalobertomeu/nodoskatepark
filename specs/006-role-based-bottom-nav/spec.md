# Feature Specification: Navegación Principal por Barra Inferior según Rol

**Feature Branch**: `006-role-based-bottom-nav`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "como skater logueado, quiero navegar con un bottomnavbar entre la pagina de reserva de clases, la pagina de mi perfil y la pagina de configuraciones. Como admin logeado, quiero navegar entre el listado de skaters, el listado de staff, la configuracion de horario de clases"

## Clarifications

### Session 2026-08-27

- Q: La descripción define los destinos de skater y de administrador, pero no los de instructor,
  que es el tercer rol del producto y comparte la aplicación de gestión con el administrador con
  menos permisos. ¿Qué destinos ve un instructor? → A: Dos destinos — el listado de skaters (que
  002-staff-skater-directory ya le permite ver) y la configuración de horarios de clases. El
  listado de staff NO aparece para instructor, respetando que 005-staff-directory lo definió como
  exclusivo de administrador; esa especificación no se reabre.
- Q: Los tres destinos enumerados para el administrador son todos de gestión y ninguno corresponde
  a su cuenta personal, mientras que el skater sí recibe un destino de configuración propio.
  ¿Dónde viven el cierre de sesión y los datos de la cuenta para un instructor o un administrador?
  → A: En un elemento persistente (avatar) en el encabezado de cada sección, no en la barra
  inferior. La barra de staff conserva únicamente los destinos de gestión; la cuenta propia es una
  acción secundaria, no un destino de primer nivel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El skater navega su aplicación desde la barra inferior (Priority: P1)

Un skater que inició sesión ve, en el borde inferior de la pantalla, una barra fija con tres
destinos identificados por icono y texto: reservar clases, su perfil y su configuración. Toca
cualquiera de ellos y la sección correspondiente aparece de inmediato, con el destino activo
claramente marcado, sin tener que abrir menús ni volver a una pantalla de inicio intermedia.

**Why this priority**: Es la razón de ser de la funcionalidad y el primer contacto de un skater
con la aplicación autenticada. Hoy un skater que se loguea llega a una pantalla sin ninguna
navegación: no existe forma de moverse entre secciones. Sin esta historia no hay producto
navegable para el rol mayoritario.

**Independent Test**: Puede probarse por completo iniciando sesión como skater y verificando que
la barra aparece con exactamente sus tres destinos, que tocar cada uno lleva a la sección
correcta, y que el destino activo se distingue visualmente de los demás.

**Acceptance Scenarios**:

1. **Given** un skater autenticado con su onboarding completo, **When** llega a la aplicación,
   **Then** el sistema muestra una barra inferior persistente con los destinos "Reservar clases",
   "Mi perfil" y "Configuración", cada uno con icono y texto, y marca uno de ellos como activo.
2. **Given** un skater viendo su perfil, **When** toca el destino "Reservar clases", **Then** el
   sistema muestra esa sección, marca ese destino como activo, y la barra permanece visible y en
   la misma posición durante toda la transición.
3. **Given** un skater en cualquier sección, **When** observa la pantalla, **Then** los tres
   destinos permanecen accesibles con un solo toque, sin necesidad de abrir un menú, desplegar
   una gaveta lateral ni retroceder a una pantalla previa.

---

### User Story 2 - El staff navega la aplicación de gestión desde la barra inferior (Priority: P1)

Un administrador que inició sesión ve una barra inferior con los destinos propios de su rol: el
listado de skaters, el listado de staff y la configuración de horarios de clases. Un instructor ve
la suya, más acotada: el listado de skaters y la configuración de horarios de clases, sin el
listado de staff. Ninguno de los dos ve un destino que su rol no le permita usar, ni los destinos
propios de un skater.

**Why this priority**: Es la mitad restante de la funcionalidad y lo que la convierte en
navegación consciente del rol, en lugar de una barra única para todos. El staff ya tiene
superficies construidas (listado de skaters, listado de staff) que hoy solo se alcanzan
escribiendo la dirección a mano; esta historia les da por primera vez un lugar en la aplicación,
y es donde la diferencia de jerarquía entre instructor y administrador se vuelve visible.

**Independent Test**: Puede probarse iniciando sesión como administrador y luego como instructor,
verificando que cada uno recibe exactamente su conjunto de destinos, que el listado de staff
aparece solo para el administrador, que ningún destino de skater aparece para ninguno de los dos,
y que cada destino abre la sección correcta.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** llega a la aplicación, **Then** el sistema
   muestra una barra inferior con los destinos "Skaters", "Staff" y "Horarios de clases", y
   ninguno de los destinos propios del rol skater.
2. **Given** un instructor autenticado, **When** llega a la aplicación, **Then** el sistema muestra
   una barra inferior con los destinos "Skaters" y "Horarios de clases", sin el destino "Staff" y
   sin ninguno de los destinos propios del rol skater.
3. **Given** un administrador en el listado de skaters, **When** toca "Staff", **Then** el sistema
   muestra el listado de staff y marca ese destino como activo.
4. **Given** un administrador en el listado de staff, **When** quiere asignar el rol de instructor
   a alguien, **Then** puede llegar a esa acción desde ese mismo destino sin exceder tres toques
   contados desde la raíz del destino.
5. **Given** una cuenta de staff en cualquier sección, **When** quiere cerrar sesión o consultar
   los datos de su propia cuenta, **Then** puede hacerlo desde el elemento de cuenta persistente
   del encabezado, sin que eso ocupe un destino de la barra inferior.
6. **Given** un instructor autenticado, **When** intenta abrir directamente el listado de staff,
   **Then** el sistema rechaza el acceso, independientemente de que la barra nunca se lo haya
   ofrecido.
7. **Given** una cuenta con rol skater, **When** intenta abrir directamente una sección exclusiva
   de staff, **Then** el sistema rechaza el acceso, independientemente de que la barra nunca se
   la haya ofrecido.

---

### User Story 3 - La navegación conserva el estado de cada sección (Priority: P2)

Una persona que estaba recorriendo una lista larga cambia a otro destino y vuelve: encuentra la
sección tal como la dejó, en la misma posición de desplazamiento y con lo que había escrito o
filtrado todavía presente, sin que la pantalla se recargue por completo entre destinos.

**Why this priority**: Es lo que separa una aplicación que se siente nativa de un sitio web con
enlaces. Sin esto la barra funciona, pero cada cambio de destino descarta el trabajo en curso y
obliga a volver a encontrar el lugar, que es exactamente la fricción que esta funcionalidad
existe para eliminar. Se prioriza por debajo de P1 porque la navegación es usable sin ello.

**Independent Test**: Puede probarse desplazándose hasta el fondo de un listado, cambiando de
destino, volviendo, y verificando que la posición y el estado previo se conservan y que en ningún
momento hubo una pantalla en blanco intermedia.

**Acceptance Scenarios**:

1. **Given** un administrador desplazado hasta el final del listado de skaters, **When** cambia al
   destino "Staff" y luego vuelve a "Skaters", **Then** el listado aparece en la misma posición de
   desplazamiento en la que lo dejó.
2. **Given** una persona con un texto de búsqueda escrito en un listado, **When** cambia de destino
   y vuelve, **Then** el texto de búsqueda y los resultados filtrados siguen ahí.
3. **Given** una persona cambiando entre destinos, **When** ocurre la transición, **Then** no se
   observa una recarga completa de la pantalla ni un intervalo en blanco antes del nuevo contenido.

---

### User Story 4 - Los destinos aún no construidos se comunican con honestidad (Priority: P3)

Una persona toca un destino cuya funcionalidad todavía no existe y encuentra una pantalla que le
dice con claridad que esa sección está en preparación, en lugar de un error, una pantalla vacía
sin explicación o un destino que no responde al toque.

**Why this priority**: Dos de los destinos nombrados —la reserva de clases del skater y la
configuración de horarios de clases del staff— corresponden a funcionalidades que aún no se
especificaron. La barra necesita existir antes que ellas para que cada una tenga dónde alojarse
cuando llegue, pero un destino que falla al tocarlo daña la confianza más de lo que la barra la
construye. Es P3 porque es un estado transitorio que desaparece a medida que cada funcionalidad se
construye.

**Independent Test**: Puede probarse tocando cada destino todavía no construido y verificando que
muestra un estado explícito de sección en preparación, sin errores y sin dejar a la persona
atrapada.

**Acceptance Scenarios**:

1. **Given** un skater autenticado, **When** toca "Reservar clases" antes de que esa funcionalidad
   exista, **Then** el sistema muestra un estado explícito de sección en preparación, la barra
   sigue visible y funcional, y la persona puede irse a otro destino con un solo toque.
2. **Given** cualquier destino en preparación, **When** la persona lo abre, **Then** el sistema no
   muestra un mensaje de error, una pantalla en blanco ni un destino que ignore el toque.

---

### User Story 5 - La misma navegación en pantallas grandes (Priority: P3)

Una persona que abre la aplicación desde una tablet o una computadora encuentra los mismos
destinos, en el mismo orden y a la misma profundidad que en el teléfono, presentados de la forma
que corresponde a esa pantalla, sin secciones que aparezcan o desaparezcan según el tamaño.

**Why this priority**: Garantiza que no se construyan dos productos distintos con dos mapas
distintos. Es P3 porque el uso predominante es en teléfono, dentro del skatepark, pero la
divergencia entre tamaños es costosa de revertir una vez que se instala.

**Independent Test**: Puede probarse abriendo la aplicación a distintos anchos y verificando que
el conjunto de destinos, su orden y la cantidad de toques hasta cada acción no cambian.

**Acceptance Scenarios**:

1. **Given** la aplicación abierta a un ancho de escritorio, **When** la persona observa la
   navegación, **Then** encuentra los mismos destinos, en el mismo orden, que a ancho de teléfono.
2. **Given** cualquier ancho desde 320 píxeles en adelante, **When** la persona recorre cualquier
   sección, **Then** no necesita desplazarse horizontalmente para ver el contenido.

---

### Edge Cases

- ¿Qué ocurre cuando el rol de una cuenta cambia mientras su sesión está activa (por ejemplo, un
  administrador la promueve de skater a instructor)? El conjunto de destinos debe pasar a ser el
  del nuevo rol sin requerir que la persona cierre sesión manualmente.
- ¿Qué ocurre si la sesión expira o se revoca mientras la persona está navegando? Debe salir del
  entorno navegable hacia el ingreso, sin quedar en una sección con la barra visible y sin datos.
- ¿Qué ocurre si un skater con onboarding incompleto intenta abrir directamente un destino? El
  paso obligatorio de onboarding sigue teniendo prioridad y la barra no se muestra hasta
  completarlo.
- ¿Qué ocurre si alguien abre directamente la dirección de una sección que su rol no puede ver?
  El acceso se rechaza igual que si hubiera intentado llegar por cualquier otro medio.
- ¿Qué ocurre con los nombres de destino en las pantallas más angostas? Deben seguir siendo
  legibles y no romper la disposición de la barra ni superponerse entre sí.
- ¿Qué ocurre al tocar el destino que ya está activo? No debe reiniciar ni vaciar la sección.

## Requirements *(mandatory)*

### Functional Requirements

**Barra de navegación**

- **FR-001**: El sistema MUST mostrar una barra de navegación fija en el borde inferior de la
  pantalla en toda superficie de la aplicación autenticada.
- **FR-002**: Cada destino de la barra MUST presentarse con un icono y una etiqueta de texto.
- **FR-003**: La barra MUST indicar visualmente y de forma inequívoca cuál es el destino activo.
- **FR-004**: La barra MUST permanecer visible y en su posición mientras la persona navega dentro
  de un destino y al cambiar entre destinos.
- **FR-005**: La barra MUST NOT mostrarse en las superficies no autenticadas (ingreso, registro,
  recuperación de contraseña, verificación de email) ni durante el onboarding obligatorio de
  skaters, que conserva su carácter de paso bloqueante previo.
- **FR-006**: Tocar el destino que ya está activo MUST NOT descartar el estado de esa sección.

**Destinos por rol**

- **FR-007**: El conjunto de destinos que la barra presenta MUST derivarse del rol de la cuenta
  autenticada.
- **FR-008**: Una cuenta con rol skater MUST ver exactamente tres destinos: reservar clases, su
  propio perfil y su configuración.
- **FR-009**: Una cuenta con rol administrador MUST ver exactamente tres destinos: el listado de
  skaters, el listado de staff y la configuración de horarios de clases.
- **FR-010**: Una cuenta con rol instructor MUST ver exactamente dos destinos: el listado de
  skaters y la configuración de horarios de clases. El listado de staff MUST NOT aparecer en la
  barra de un instructor, por seguir siendo exclusivo de administrador.
- **FR-011**: La barra MUST NOT ofrecer a una cuenta ningún destino que su rol no tenga permitido
  usar.
- **FR-012**: El sistema MUST seguir rechazando el acceso a una sección para la que la cuenta no
  tiene permiso aunque se intente alcanzarla sin pasar por la barra; ocultar un destino es una
  decisión de presentación y nunca el único control de acceso.
- **FR-013**: Tras un ingreso exitoso, el sistema MUST llevar a la persona al primer destino de su
  rol, sin exigir ningún toque adicional ni intercalar una pantalla de inicio sin contenido.
- **FR-014**: Si el rol de una cuenta cambia mientras su sesión está activa, el sistema MUST
  presentar el conjunto de destinos del nuevo rol sin requerir un cierre de sesión manual.
- **FR-015**: El sistema MUST ofrecer a toda cuenta autenticada un lugar alcanzable para cerrar
  sesión y consultar los datos de su propia cuenta, disponible desde la primera versión de esta
  funcionalidad y nunca detrás de una sección en preparación.
- **FR-016**: Para las cuentas de staff (instructor y administrador), ese lugar MUST ser un
  elemento de cuenta persistente en el encabezado de cada sección. La barra inferior de staff MUST
  conservar únicamente destinos de gestión.
- **FR-017**: El elemento de cuenta del encabezado MUST limitarse a la cuenta propia — sus datos y
  el cierre de sesión — y MUST NOT usarse para alojar navegación entre secciones, que sigue siendo
  responsabilidad exclusiva de la barra inferior.
- **FR-018**: Para las cuentas skater, ese lugar es su destino de configuración, que por lo tanto
  MUST presentarse con contenido real desde la primera versión — al menos los datos de la cuenta y
  el cierre de sesión — y MUST NOT quedar como una sección en preparación.

**Comportamiento de la navegación**

- **FR-019**: Cambiar a otro destino y volver MUST restaurar la posición de desplazamiento y el
  estado de la vista previa del destino de origen.
- **FR-020**: La navegación entre destinos MUST NOT provocar una recarga completa de la pantalla
  ni un intervalo visible en blanco.
- **FR-021**: Desde la raíz de cualquier destino, toda acción primaria del producto MUST ser
  alcanzable en un máximo de tres toques.
- **FR-022**: Las superficies ya existentes que no son destinos de primer nivel — el perfil
  individual de un skater y la asignación del rol de instructor — MUST ser alcanzables anidadas
  bajo su destino correspondiente, con una forma explícita de volver al nivel anterior.
- **FR-023**: Ninguna pantalla de la aplicación MUST consistir únicamente en una lista de enlaces
  a otras pantallas.
- **FR-024**: Si la sesión expira o se revoca durante la navegación, el sistema MUST sacar a la
  persona del entorno navegable hacia el ingreso.

**Destinos en preparación**

- **FR-025**: Un destino cuya funcionalidad todavía no fue construida MUST mostrar un estado
  explícito e identificable de sección en preparación.
- **FR-026**: Un destino en preparación MUST NOT presentarse como un error, una pantalla vacía sin
  explicación, ni un destino que ignore el toque, y MUST permitir salir hacia otro destino con un
  solo toque.

**Presentación y alcance físico**

- **FR-027**: Todo elemento interactivo de la barra MUST ofrecer un área tocable de al menos
  44 × 44 píxeles.
- **FR-028**: La barra MUST respetar las áreas seguras del dispositivo, de modo que no quede
  tapada por los elementos del sistema operativo ni los tape.
- **FR-029**: La aplicación MUST presentarse sin desplazamiento horizontal desde un ancho de
  320 píxeles en adelante.
- **FR-030**: En anchos de tablet y escritorio, la navegación MAY presentarse como un riel o
  columna lateral, pero los destinos, su orden y la cantidad de toques hasta cada acción MUST
  permanecer idénticos a los del teléfono.
- **FR-031**: Ninguna sección MUST estar disponible en un tamaño de pantalla y ausente en otro.

### Key Entities

- **Destino de navegación**: cada una de las secciones de primer nivel que la barra ofrece.
  Tiene un nombre visible, un icono, un orden dentro de la barra, y un estado de disponibilidad
  (construido o en preparación).
- **Conjunto de destinos por rol**: la lista ordenada de destinos que corresponde a cada rol del
  producto. Es la definición de la arquitectura de información de la aplicación y la única fuente
  de qué ve cada rol en la barra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde la raíz de cualquier destino, el 100 % de las acciones primarias del producto
  se alcanza en tres toques o menos.
- **SC-002**: Cambiar de destino y volver conserva la posición de desplazamiento y el estado
  previo en el 100 % de los destinos que presentan listados o formularios.
- **SC-003**: Una persona que inicia sesión llega a contenido útil de su rol sin ningún toque
  adicional después de ingresar.
- **SC-004**: Una persona que abre la aplicación por primera vez identifica y visita los tres
  destinos de su rol en menos de 30 segundos, sin instrucciones previas.
- **SC-005**: En el 100 % de las combinaciones de rol y destino, ninguna cuenta ve en la barra una
  sección que su rol no puede usar.
- **SC-006**: La aplicación se recorre completa sin desplazamiento horizontal en todo ancho desde
  320 píxeles en adelante.
- **SC-007**: El conjunto de destinos, su orden y la profundidad de cada camino son idénticos entre
  el ancho de teléfono y el de escritorio, sin excepciones.
- **SC-008**: Ningún destino ofrecido por la barra produce un error al abrirlo, incluidos los que
  todavía están en preparación.

## Assumptions

- **Esta funcionalidad construye la navegación, no los destinos nuevos.** Dos de los destinos
  nombrados corresponden a funcionalidades que todavía no fueron especificadas: la reserva de
  clases del skater y la configuración de horarios de clases del staff. Esta especificación crea
  sus lugares en la barra y define su estado de sección en preparación (FR-025, FR-026), pero no
  define ni construye esas funcionalidades: cada una requiere su propia especificación. Este
  criterio replica el patrón ya usado en el producto para datos que aún no existen — el marcador
  de "perfil incompleto" de 002-staff-skater-directory y el estado de "sin ingresos registrados"
  para el control de acceso todavía no construido.
- **La configuración del skater es la excepción a lo anterior**: aunque tampoco fue especificada,
  no puede quedar como sección en preparación, porque es el único lugar donde un skater cierra
  sesión (FR-018). Se construye con su contenido mínimo real —datos de la cuenta y cierre de
  sesión— y queda abierta a ampliarse en una especificación posterior. Sin esto, la primera
  versión dejaría a los skaters sin forma de salir de la aplicación.
- Los tres destinos restantes ya existen y esta funcionalidad los adopta sin modificarlos: el
  perfil propio del skater (004-skater-onboarding), el listado de skaters
  (002-staff-skater-directory) y el listado de staff (005-staff-directory).
- **El listado de staff sigue siendo exclusivo de administrador**, tal como lo fijó
  005-staff-directory: esta funcionalidad no lo abre al rol instructor, solo decide que no aparece
  en su barra. La ampliación de ese alcance, si alguna vez se decide, sería explícita y ajena a
  esta especificación.
- **La cuenta propia del staff no ocupa un destino de la barra.** Vive en un elemento persistente
  del encabezado, lo que mantiene la barra de staff dedicada a la gestión. Esto no contradice que
  la barra inferior sea la navegación primaria: el elemento de cuenta es una acción secundaria
  sobre la propia sesión, no un camino hacia otra sección (FR-017).
- **La asignación del rol de instructor (003-instructor-role-assignment) se anida bajo el destino
  "Staff"**, por ser la acción natural sobre ese listado, en lugar de recibir un destino propio de
  primer nivel. La descripción del administrador enumera tres destinos y esa funcionalidad ya
  existente necesitaba un lugar; anidarla mantiene la barra en tres destinos y respeta el techo de
  tres toques.
- **El perfil individual de un skater (002) se anida bajo el destino "Skaters"**, alcanzable desde
  el listado, por el mismo criterio.
- Los roles son mutuamente excluyentes: toda cuenta tiene exactamente uno, según el lenguaje de
  roles del producto. Ninguna cuenta ve dos conjuntos de destinos a la vez.
- El staff no necesita acceder a las superficies propias del skater (reservar una clase para sí
  mismo, por ejemplo); si el negocio lo requiriera, sería una ampliación explícita de alcance.
- El paso de onboarding obligatorio del skater (004) conserva su prioridad sobre esta navegación:
  una cuenta con el perfil incompleto sigue bloqueada en ese paso y no accede a la barra.
- La elección concreta de cada icono, y los nombres definitivos visibles de cada destino, se
  resuelven en la fase de diseño y planificación; esta especificación fija cuántos destinos hay,
  cuáles son y a qué rol pertenecen.
- La cantidad de destinos por rol se mantiene dentro del rango de dos a cinco que fija el gobierno
  del proyecto para la navegación de primer nivel.

### Dependencies

- **001-user-login-sso**: provee la sesión autenticada y su rol, que es lo que determina el
  conjunto de destinos. También aporta las superficies no autenticadas donde la barra no debe
  aparecer.
- **004-skater-onboarding**: su paso bloqueante precede a esta navegación.
- **002-staff-skater-directory**, **005-staff-directory**, **003-instructor-role-assignment**:
  aportan las superficies existentes que esta funcionalidad organiza como destinos o como
  secciones anidadas.
