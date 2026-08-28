# Feature Specification: Configuración del Calendario de Clases

**Feature Branch**: `007-class-schedule-config`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "Como admin, quiero poder configurar el horario de las clases de skate. Por el momento, la clase se define como un rango horario (en general siempre es de 1 hora el slot). El horario tiene una categoria (menores/adultos - iniciantes/intermedios/avanzados). tambien desde esta vista puedo configurar a que hora abre y cierra el skatepark (rango maximo de configuracion de clases). En esta vista de configuracion de clases, solo se arma el calendario. En el dia que tocan las clases, se registran que skaters asisten y cuales son los instructores que imparten la clase, pero eso es parte de otra spec."

## Clarifications

### Session 2026-08-28

- Q: ¿El skatepark puede dictar dos clases al mismo tiempo, o solo una por franja horaria?
  → A: Solo una por vez. Cualquier solapamiento se rechaza, sin importar la categoría. Queda
  descartada la noción de pista o espacio: el skatepark dicta una clase a la vez y esa es una
  decisión del negocio, no un supuesto pendiente de confirmar.
- Q: En un teléfono, ¿cómo se ve la grilla semanal, si siete días por franjas horarias no entran a
  320 px sin desplazamiento horizontal? → A: Un día por vez, como lista vertical de clases, con un
  selector de día. En tablet y escritorio se despliega la semana completa en columnas. El conjunto
  de clases y la profundidad de cada camino no cambian entre anchos: solo cambia cuántos días se
  ven a la vez.
- Q: Si el país cambia la hora o alguien abre la aplicación desde otra zona horaria, ¿qué significa
  "17:00" en la grilla? → A: La hora local del skatepark, siempre. Es hora de reloj de pared: no se
  convierte a la zona de quien mira ni se corre con el horario de verano. Dos personas del staff,
  estén donde estén, ven la misma hora para la misma clase.
- Q: Cuando un administrador cambia o borra una clase, ¿qué pasa con las semanas que ya pasaron?
  → A: Nada: la grilla describe únicamente cómo son las clases ahora. No hay versiones ni fechas de
  vigencia, y un cambio no puede consultarse en retrospectiva. Lo que efectivamente ocurrió cada día
  es dato de la funcionalidad de asistencia, que lo registra por su cuenta y no reconstruye la
  grilla vieja.
- Q: ¿Qué garantiza esta sección en accesibilidad desde la primera versión, si 006 fijó una base
  solo para la navegación? → A: Una base acotada a lo que esta funcionalidad introduce: cada clase
  anunciable con su día, hora y categoría en texto y nunca solo por color; el selector de día y toda
  acción de la grilla alcanzables y activables por teclado con foco visible; formularios con
  etiquetas asociadas; y errores de validación anunciados, con el foco llevado al campo a corregir.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El administrador arma la grilla semanal de clases (Priority: P1)

Un administrador abre el destino "Horarios de clases" y encuentra la grilla semanal del skatepark.
Crea una clase indicando el día de la semana, la hora de inicio, la hora de fin y su categoría —por
ejemplo, martes de 17:00 a 18:00, menores iniciantes—. La clase aparece de inmediato en la grilla,
en su día y a su hora, distinguible de las demás por su categoría, y rige todas las semanas hasta
que alguien la cambie.

**Why this priority**: Es la razón de ser de la funcionalidad y el dato del que dependen todas las
que vienen después. Hoy el destino "Horarios de clases" existe en la barra pero está en
preparación: no hay forma de decir cuándo hay clases, y sin eso no puede haber reserva, ni
asistencia, ni asignación de instructores.

**Independent Test**: Puede probarse por completo iniciando sesión como administrador, creando
varias clases con distintos días, horas y categorías, y verificando que la grilla las muestra en el
lugar correcto y que sobreviven a una recarga.

**Acceptance Scenarios**:

1. **Given** un administrador en el destino "Horarios de clases" sin ninguna clase configurada,
   **When** observa la pantalla, **Then** el sistema muestra la grilla semanal vacía con un estado
   explícito que invita a crear la primera clase, nunca una pantalla en blanco ni un error.
2. **Given** un administrador en la grilla, **When** crea una clase indicando día de la semana, hora
   de inicio, hora de fin y categoría, **Then** la clase aparece en ese día y franja horaria, y
   sigue ahí después de recargar.
3. **Given** un administrador creando una clase, **When** indica la hora de inicio, **Then** el
   sistema propone una duración de una hora, que la persona puede modificar.
4. **Given** una grilla con clases de distintas categorías, **When** el administrador la mira,
   **Then** puede distinguir la categoría de cada clase sin abrirla.
5. **Given** un administrador creando una clase, **When** intenta guardarla sin elegir franja
   etaria o sin elegir nivel, **Then** el sistema no la guarda y explica cuál falta.
6. **Given** una clase configurada un martes, **When** transcurre más de una semana, **Then** la
   clase sigue rigiendo los martes sin que nadie tenga que volver a cargarla.
7. **Given** un administrador en un teléfono, **When** abre la sección, **Then** ve las clases del
   día actual como lista vertical y puede cambiar a otro día con el selector, sin desplazarse
   horizontalmente.

---

### User Story 2 - El administrador define cuándo abre el skatepark cada día (Priority: P2)

Desde la misma vista, un administrador configura a qué hora abre y a qué hora cierra el skatepark,
día por día, y puede marcar un día entero como cerrado. Ese horario es el máximo dentro del cual
pueden ubicarse las clases de ese día: el sistema no permite programar una clase fuera del horario
en que el skatepark está abierto, ni en un día cerrado.

**Why this priority**: Es la barrera que evita que la grilla se llene de clases imposibles. Es P2 y
no P1 porque la grilla es usable sin ella —simplemente sin ese control—, pero sin ella nada impide
programar una clase a las tres de la mañana o un día que el skatepark no abre.

**Independent Test**: Puede probarse configurando horarios distintos para dos días, intentando crear
una clase fuera del horario de uno de ellos y verificando que el sistema la rechaza explicando por
qué, y luego creando una dentro y verificando que sí se guarda.

**Acceptance Scenarios**:

1. **Given** un administrador en el destino "Horarios de clases", **When** configura la hora de
   apertura y la de cierre de un día de la semana, **Then** el sistema las guarda y las presenta
   como el horario vigente de ese día.
2. **Given** un administrador configurando los horarios, **When** marca un día como cerrado,
   **Then** el sistema lo registra y ese día deja de admitir clases.
3. **Given** el horario de un día configurado, **When** el administrador intenta crear una clase de
   ese día que empieza antes de la apertura o termina después del cierre, **Then** el sistema no la
   guarda y explica que queda fuera del horario del skatepark para ese día.
4. **Given** un día marcado como cerrado, **When** el administrador intenta crear una clase ese día,
   **Then** el sistema no la guarda y explica que el skatepark no abre ese día.
5. **Given** clases ya configuradas, **When** el administrador intenta achicar el horario de un día
   —o marcarlo como cerrado— de modo que alguna clase quedaría afuera, **Then** el sistema no aplica
   el cambio, explica cuáles clases lo impiden y lo deja resolver antes de reintentar.
6. **Given** un administrador configurando el horario de un día, **When** indica una hora de cierre
   anterior o igual a la de apertura, **Then** el sistema no la guarda y explica el motivo.

---

### User Story 3 - El administrador corrige la grilla (Priority: P2)

Los horarios cambian. Un administrador modifica el día, la hora o la categoría de una clase ya
configurada, o la elimina cuando deja de dictarse, sin tener que rehacer la grilla entera.

**Why this priority**: Una grilla que solo se puede llenar y no corregir se vuelve inútil en cuanto
cambia algo, que es lo normal en la operación de un skatepark. Es P2 porque el valor inicial se
entrega con la creación: sin edición, la grilla ya sirve para la primera carga.

**Independent Test**: Puede probarse creando una clase, cambiándole el día, la hora y la categoría,
verificando que la grilla refleja el cambio, y luego eliminándola y verificando que desaparece.

**Acceptance Scenarios**:

1. **Given** una clase configurada, **When** el administrador cambia su día, su hora o su categoría,
   **Then** la grilla refleja el cambio de inmediato y las mismas validaciones que rigen la creación
   se aplican a la edición.
2. **Given** una clase configurada, **When** el administrador la elimina, **Then** desaparece de la
   grilla y el sistema pide una confirmación explícita antes de hacerlo.
3. **Given** un administrador editando una clase, **When** el cambio la dejaría solapada con otra o
   fuera del horario del skatepark de su día, **Then** el sistema no lo guarda y explica el
   conflicto.

---

### User Story 4 - El instructor consulta la grilla sin modificarla (Priority: P3)

Un instructor abre "Horarios de clases" y ve la misma grilla semanal que el administrador, para
saber cuándo se dictan las clases y de qué categoría es cada una. No puede crear, editar ni
eliminar clases, ni tocar el horario del skatepark: esas son capacidades exclusivas del
administrador, y la pantalla no se las ofrece.

**Why this priority**: 006 ya le reservó el destino al instructor, así que la sección existe en su
barra y hoy está en preparación; dejarla vacía sería incumplir lo que esa funcionalidad prometió.
Es P3 porque el valor operativo está en que la grilla exista y sea correcta, cosa que depende del
administrador.

**Independent Test**: Puede probarse iniciando sesión como instructor, abriendo el destino,
verificando que ve la grilla completa con todas las categorías, y que no encuentra ninguna acción
para modificarla.

**Acceptance Scenarios**:

1. **Given** un instructor autenticado, **When** abre el destino "Horarios de clases", **Then** ve
   la grilla semanal con todas las clases configuradas, su horario y su categoría, y el horario de
   apertura del skatepark.
2. **Given** un instructor viendo la grilla, **When** la recorre, **Then** no encuentra ninguna
   acción para crear, editar o eliminar clases, ni para cambiar el horario del skatepark.
3. **Given** un instructor autenticado, **When** intenta modificar el calendario sin pasar por la
   interfaz, **Then** el sistema rechaza el cambio, independientemente de que la pantalla nunca se
   lo haya ofrecido.

---

### Edge Cases

- ¿Qué ocurre si dos clases se solapan en el mismo día y horario? El sistema lo impide y explica con
  cuál entra en conflicto; el skatepark dicta una clase por vez.
- ¿Qué ocurre si se intenta achicar el horario de un día, o cerrarlo, dejando clases afuera? El
  cambio no se aplica: el sistema nombra las clases que lo impiden en lugar de borrarlas o dejarlas
  huérfanas.
- ¿Qué ocurre con una clase cuya hora de fin es anterior o igual a la de inicio? No se guarda.
- ¿Qué ocurre con una clase que cruzaría la medianoche? No se admite: una clase empieza y termina el
  mismo día, dentro del horario de apertura de ese día.
- ¿Qué ocurre si el horario del skatepark todavía no fue configurado para un día? Las clases de ese
  día pueden crearse sin esa restricción, y el sistema indica que el horario de ese día no está
  definido.
- ¿Qué ocurre con un feriado o una clase que se suspende una sola vez? Queda fuera del alcance: la
  grilla define el patrón semanal, no las excepciones de una fecha puntual.
- ¿Qué ocurre si alguien quiere saber qué clases había hace tres meses? La grilla no lo responde:
  describe solo la configuración vigente. Reconstruir el pasado es dato de la funcionalidad de
  asistencia, no de esta.
- ¿Qué ocurre cuando el país cambia al horario de verano? Nada: las clases siguen en la misma hora
  de reloj de pared. Una clase de las 17:00 se sigue dictando a las 17:00, sin que nadie tenga que
  recorrer la grilla corrigiéndola.
- ¿Qué ocurre si dos administradores editan la grilla a la vez? El último cambio guardado es el que
  queda, y quien pierda debe ver la grilla actualizada en lugar de creer que su cambio se aplicó.
- ¿Qué ocurre si un instructor o un skater intenta modificar la grilla sin pasar por la interfaz? El
  sistema rechaza el cambio igual que si lo hubiera intentado desde la pantalla.
- ¿Qué ocurre en la primera visita, con la grilla vacía? Estado explícito que invita a crear la
  primera clase, nunca una pantalla en blanco.
- ¿Qué ocurre con un día sin ninguna clase, en la vista de un día por vez? El sistema lo indica
  explícitamente —ese día no tiene clases— en lugar de mostrar un espacio vacío indistinguible de
  un error de carga.

## Requirements *(mandatory)*

### Functional Requirements

**La grilla semanal**

- **FR-001**: El sistema MUST presentar las clases configuradas ubicadas por día de la semana y por
  franja horaria.
- **FR-001a**: En anchos de teléfono, el sistema MUST presentar un día por vez —sus clases como
  lista vertical ordenada por hora— con un selector que permita cambiar de día. MUST NOT requerir
  desplazamiento horizontal desde 320 px.
- **FR-001b**: En anchos de tablet y escritorio, el sistema MAY presentar la semana completa en
  columnas. El conjunto de clases, su información y la cantidad de toques hasta cada acción MUST
  permanecer idénticos a los del teléfono; lo único que MUST cambiar es cuántos días se ven a la
  vez.
- **FR-001c**: El día que el selector muestra al abrir la sección MUST ser el día actual.
- **FR-002**: Un administrador MUST poder crear una clase indicando su día de la semana, su hora de
  inicio, su hora de fin y su categoría.
- **FR-003**: Al crear una clase, el sistema MUST proponer una duración de una hora, y la persona
  MUST poder modificarla.
- **FR-004**: La grilla MUST distinguir visualmente la categoría de cada clase sin que haya que
  abrirla.
- **FR-004a**: La categoría, el día y el horario de cada clase MUST estar disponibles como texto
  anunciable por un lector de pantalla. La categoría MUST NOT comunicarse únicamente por color o
  forma.
- **FR-005**: Cuando no hay ninguna clase configurada, el sistema MUST mostrar un estado explícito
  que invite a crear la primera, y MUST NOT mostrar una pantalla vacía ni un error.
- **FR-006**: La grilla MUST persistir: las clases configuradas siguen ahí tras recargar o volver a
  entrar.
- **FR-007**: Una clase configurada MUST regir todas las semanas en su día y horario, sin que nadie
  vuelva a cargarla, hasta que se la modifique o elimine. El sistema MUST NOT requerir una carga
  semana a semana.
- **FR-007a**: Esta funcionalidad MUST NOT contemplar excepciones a una fecha puntual —suspender la
  clase de un feriado, moverla una sola vez—. La grilla define el patrón semanal; las excepciones,
  si el negocio las necesita, corresponden a una especificación propia.

**La categoría de una clase**

- **FR-008**: Toda clase MUST tener exactamente una categoría, compuesta por dos atributos
  obligatorios: una franja etaria y un nivel.
- **FR-009**: La franja etaria MUST ser una de: menores, adultos.
- **FR-010**: El nivel MUST ser uno de: iniciantes, intermedios, avanzados.
- **FR-011**: El sistema MUST NOT guardar una clase a la que le falte la franja etaria o el nivel, y
  MUST explicar cuál falta.

**El horario del skatepark**

- **FR-012**: Un administrador MUST poder configurar la hora de apertura y la hora de cierre del
  skatepark desde la misma vista de la grilla.
- **FR-013**: El horario MUST configurarse por día de la semana: cada uno de los siete días tiene su
  propio rango, y un día MUST poder marcarse como cerrado.
- **FR-014**: El horario de un día MUST funcionar como el rango máximo dentro del cual puede
  ubicarse una clase de ese día.
- **FR-015**: El sistema MUST rechazar la creación o la edición de una clase que empiece antes de la
  apertura o termine después del cierre de su día, y MUST explicar el motivo.
- **FR-015a**: El sistema MUST rechazar toda clase ubicada en un día marcado como cerrado, y MUST
  explicar el motivo.
- **FR-016**: El sistema MUST NOT aplicar un cambio del horario de un día —achicarlo o cerrarlo—
  que dejaría clases ya configuradas fuera del rango. MUST identificar cuáles lo impiden y permitir
  resolverlo antes de reintentar.
- **FR-017**: El sistema MUST NOT guardar el horario de un día cuya hora de cierre sea anterior o
  igual a la de apertura.
- **FR-018**: Mientras el horario de un día no esté configurado, el sistema MUST permitir crear
  clases ese día sin esa restricción y MUST indicar que su horario todavía no está definido.
- **FR-018a**: Toda hora de esta funcionalidad —la de una clase y la de apertura o cierre del
  skatepark— MUST interpretarse como hora local del skatepark, en el sentido de reloj de pared. El
  sistema MUST NOT convertirla a la zona horaria de quien la mira, y un cambio de horario estacional
  MUST NOT desplazar las clases ya configuradas.

**Validación de una clase**

- **FR-019**: El sistema MUST NOT guardar una clase cuya hora de fin sea anterior o igual a su hora
  de inicio.
- **FR-020**: Una clase MUST empezar y terminar el mismo día; el sistema MUST NOT admitir una que
  cruce la medianoche.
- **FR-021**: El sistema MUST NOT permitir que dos clases del mismo día se solapen en el tiempo, y
  MUST indicar con cuál entra en conflicto. El rechazo MUST aplicarse aunque las dos clases sean de
  categorías distintas: el skatepark dicta una clase por vez.
- **FR-022**: Todo rechazo de validación MUST explicarse en lenguaje claro, indicando qué corregir,
  y MUST NOT descartar lo que la persona ya había cargado.
- **FR-022a**: El rechazo MUST anunciarse a las tecnologías de asistencia y MUST llevar el foco al
  campo que hay que corregir, en lugar de dejarlo donde estaba.

**Edición y eliminación**

- **FR-023**: Un administrador MUST poder modificar el día, las horas y la categoría de una clase ya
  configurada.
- **FR-024**: Un administrador MUST poder eliminar una clase, previa confirmación explícita.
- **FR-025**: Las validaciones que rigen la creación MUST aplicarse por igual a la edición.
- **FR-025a**: La grilla MUST describir únicamente la configuración vigente. El sistema MUST NOT
  llevar versiones ni fechas de vigencia, y MUST NOT ofrecer consultar cómo era la grilla en el
  pasado: una clase modificada pasa a regir como si siempre hubiera sido así.
- **FR-025b**: Como consecuencia de FR-025a, esta funcionalidad MUST NOT ser la fuente de qué
  ocurrió efectivamente un día determinado. Ese registro corresponde a la funcionalidad de
  asistencia, que MUST guardar su propio dato sin depender de reconstruir la grilla vigente en esa
  fecha.

**Permisos**

- **FR-026**: Solo una cuenta con rol administrador MUST poder crear, modificar o eliminar clases, y
  configurar el horario del skatepark.
- **FR-026a**: Una cuenta con rol instructor MUST poder consultar la grilla completa —clases,
  horarios y categorías— y el horario del skatepark, y MUST NOT poder modificarlos.
- **FR-027**: El sistema MUST rechazar en el servidor toda modificación del calendario hecha por una
  cuenta sin permiso, aunque se intente alcanzarla sin pasar por la interfaz. Ocultar una acción es
  una decisión de presentación y nunca el único control de acceso.
- **FR-028**: El sistema MUST NOT ofrecer a una cuenta acciones que luego serían rechazadas por su
  rol.

**Alcance**

- **FR-029**: Esta funcionalidad MUST limitarse a armar la grilla. MUST NOT registrar qué skaters
  asisten a una clase ni qué instructor la imparte: eso corresponde a una especificación propia.
- **FR-030**: La grilla MUST quedar disponible como la definición de cuándo hay clases, para que las
  funcionalidades posteriores —reserva, asistencia, asignación de instructores— la consuman.

**Ubicación en la aplicación**

- **FR-031**: Esta funcionalidad MUST ocupar el destino "Horarios de clases" que
  006-role-based-bottom-nav ya reservó en la barra de instructor y administrador, haciéndolo pasar
  de su estado de sección en preparación a su contenido real. MUST NOT agregar un destino nuevo ni
  alterar el orden de la barra.
- **FR-032**: Desde la raíz del destino, crear una clase, editarla y configurar el horario del
  skatepark MUST alcanzarse en un máximo de tres toques.
- **FR-033**: El selector de día y toda acción de la grilla MUST ser alcanzables y activables
  mediante teclado, con un indicador de foco visible, en toda presentación de la sección.
- **FR-034**: Los campos de los formularios de clase y de horario del skatepark MUST tener una
  etiqueta asociada, legible por un lector de pantalla.
- **FR-035**: Esta base de accesibilidad MUST cubrir lo que esta funcionalidad introduce —la grilla,
  el selector de día y sus formularios— y MUST NOT presuponer una auditoría de conformidad completa
  del producto.

### Key Entities

- **Clase semanal**: una franja de tiempo recurrente en la que se dicta una clase. Tiene un día de
  la semana, una hora de inicio, una hora de fin y una categoría. Rige todas las semanas hasta que
  se la modifica o elimina, y solo existe en su versión vigente: no guarda historial (FR-025a). No
  tiene asistentes ni instructor asignado: eso es de otra funcionalidad.
- **Categoría de clase**: la combinación de una franja etaria (menores, adultos) y un nivel
  (iniciantes, intermedios, avanzados). Es lo que distingue una clase de otra en la grilla.
- **Horario del skatepark**: por cada día de la semana, la hora de apertura y la de cierre, o la
  marca de día cerrado. Define el rango máximo dentro del cual puede ubicarse una clase de ese día.
  Sus horas son locales del skatepark, igual que las de las clases (FR-018a).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador carga una semana completa de clases —seis franjas— en menos de cinco
  minutos, sin instrucciones previas.
- **SC-002**: El 100 % de las clases guardadas queda dentro del horario de apertura del día que les
  corresponde, cuando ese horario está configurado.
- **SC-003**: Ninguna configuración inválida llega a guardarse: solapamientos, horas invertidas,
  clases fuera del horario del skatepark, clases en días cerrados y categorías incompletas se
  rechazan siempre, con una explicación de qué corregir.
- **SC-004**: Crear una clase, editarla y configurar el horario del skatepark se alcanzan en tres
  toques o menos desde la raíz del destino.
- **SC-005**: Una persona que abre la sección identifica la hora y la categoría de cualquier clase
  del día que está viendo sin abrir ningún detalle, y llega a las clases de otro día con un solo
  toque.
- **SC-005a**: La sección se recorre completa sin desplazamiento horizontal desde 320 px de ancho, y
  el conjunto de clases y la profundidad de cada camino son idénticos entre teléfono y escritorio.
- **SC-006**: La grilla configurada sobrevive al 100 % de las recargas y de los reingresos, y sigue
  rigiendo semanas después sin ninguna carga adicional.
- **SC-006a**: El 100 % de las acciones de la sección —selector de día, crear, editar, eliminar y
  configurar el horario— se alcanza y se activa solo con teclado, con foco visible, y cada clase se
  anuncia con su día, su hora y su categoría.
- **SC-007**: Ninguna cuenta sin permiso logra modificar la grilla, ni desde la interfaz ni
  alcanzando la operación por otro medio; un instructor la ve completa y no encuentra ninguna acción
  de modificación.

## Assumptions

- **La grilla es un patrón semanal, no una carga fecha por fecha.** Una clase se configura una vez
  y rige todas las semanas (FR-007). Es lo que sugiere la descripción al hablar de "el día que
  tocan las clases", y es como opera un skatepark: la grilla es estable. Consecuencia asumida:
  suspender la clase de un feriado no tiene mecanismo en esta funcionalidad (FR-007a); si el
  negocio lo necesita, será una especificación de excepciones, que este modelo admite sin
  rehacerse.
- **El horario del skatepark se configura por día.** Siete rangos, con la posibilidad de cerrar un
  día entero (FR-013). La descripción lo menciona en singular, pero un rango único obligaría a
  ampliarlo hasta cubrir el día más largo de la semana, y la restricción perdería su valor.
- **El instructor consulta, el administrador configura.** La descripción dice "como admin", y el
  Principio VII reserva al administrador las capacidades exclusivas de gestión. El instructor
  conserva el destino que 006 le dio, con una vista de solo lectura: sin ella su barra quedaría en
  un único destino, por debajo del mínimo de dos que fija el Principio IX.
- **La categoría tiene dos dimensiones, no una lista plana.** La descripción escribe
  "menores/adultos - iniciantes/intermedios/avanzados", que se interpreta como dos atributos
  obligatorios y combinables entre sí —seis combinaciones posibles—, y no como una única lista de
  opciones. Ambos son valores fijos del producto: esta funcionalidad no permite crear categorías
  nuevas.
- **Una hora es el valor propuesto, no una regla.** La descripción dice "en general siempre es de
  1 hora el slot", así que la duración se propone en una hora y se puede cambiar, en lugar de
  quedar fija.
- **Una clase por vez.** Confirmado con el negocio: el skatepark no dicta dos clases simultáneas,
  así que todo solapamiento se rechaza sin importar la categoría (FR-021). No hay noción de pista
  ni de espacio, y no se necesita: si alguna vez se dictaran dos grupos a la vez, sería una
  ampliación explícita de alcance.
- **Sin cupo.** La grilla no define cuántas personas entran en una clase. El cupo aparecerá, si
  hace falta, cuando la reserva de clases lo requiera; agregarlo acá ampliaría el alcance sin que
  nada lo consuma todavía.
- **Sin instructor asignado.** La descripción lo excluye explícitamente: qué instructor imparte
  cada clase se registra el día de la clase, en otra funcionalidad.
- **Hay un único skatepark, con una única hora local.** Las horas son de reloj de pared y no se
  convierten (FR-018a). Si alguna vez hubiera sedes en zonas horarias distintas, cada una necesitaría
  su propia grilla y su propia zona, lo que sería una ampliación explícita de alcance.
- **La grilla es del skatepark, no de cada persona.** Hay una única grilla compartida; esta
  funcionalidad no contempla calendarios por sede ni por espacio.
- **La base de accesibilidad cubre lo que esta funcionalidad introduce** —la grilla, el selector de
  día y los formularios de clase y de horario (FR-033 a FR-035)— y no presupone una auditoría de
  conformidad del resto del producto, que si se decide sería una especificación propia. Es el mismo
  criterio con el que 006 acotó su base a la navegación.
- **Esta funcionalidad no toca la barra de navegación.** El destino "Horarios de clases" ya existe
  con su etiqueta, su orden y su dirección fijados por 006; acá solo se reemplaza su estado de
  sección en preparación por contenido real.
- **La grilla no tiene memoria.** Describe la configuración vigente y nada más (FR-025a). Se acepta
  a cambio de mantener esta funcionalidad en lo que se pidió —armar el calendario— y porque la
  funcionalidad de asistencia guardará por su cuenta lo que ocurrió cada día, sin necesitar la
  grilla histórica. Si en algún momento hiciera falta auditar cambios de horario, sería una
  ampliación explícita.
- **La grilla es el insumo de lo que viene después.** La reserva de clases —el otro destino todavía
  en preparación, y el primero que ve un skater al ingresar— no puede construirse antes que esto,
  porque no tendría clases que ofrecer.

### Dependencies

- **006-role-based-bottom-nav**: aporta el destino "Horarios de clases", su dirección y el control
  de acceso por rol de la aplicación autenticada. Esta funcionalidad lo llena sin modificarlo.
- **001-user-login-sso**: aporta la sesión autenticada y el rol que determina quién puede
  configurar la grilla y quién solo consultarla.
- **005-staff-directory** y **003-instructor-role-assignment**: definen quiénes son instructores y
  administradores, el lenguaje de roles que esta funcionalidad usa para sus permisos.
