# Phase 0 — Research: Configuración del Calendario de Clases

**Feature**: `007-class-schedule-config` | **Date**: 2026-08-28

Nueve decisiones técnicas, cada una con su motivo y las alternativas descartadas. No queda ningún
NEEDS CLARIFICATION.

---

## 1. Cómo se guarda una hora que no debe moverse nunca

**Decisión**: **minutos desde medianoche**, como entero de 0 a 1439. Aplica tanto a las horas de una
clase como a la apertura y el cierre del skatepark.

**Rationale**: FR-018a exige hora de reloj de pared —que un cambio de horario estacional no
desplace nada y que dos personas en zonas distintas vean lo mismo—. Un entero de minutos no tiene
zona horaria que convertir, así que la propiedad se cumple por construcción y no por disciplina: no
hay ningún punto del sistema donde alguien pueda convertirla por accidente. Además convierte la
comprobación de solapamiento (FR-021) en aritmética de enteros, que es exacta y ordenable en la
base de datos.

**Alternativas consideradas**:
- **`DateTime` con una fecha ficticia**: es lo que primero sale, y es justo lo que rompe. Los
  drivers y los clientes convierten `DateTime` a la zona del proceso; bastaría con que el servidor
  y el navegador difieran para que la grilla entera se corra una hora. Exactamente el fallo que
  FR-018a existe para impedir.
- **Cadena `"HH:MM"`**: legible en la base, pero obliga a parsear para comparar y admite valores
  inválidos (`"25:00"`) que el tipo no impide.
- **`TIME` de Postgres**: correcto en el motor, pero Prisma lo expone como `DateTime`, con lo que
  reaparece el problema del primer punto en la capa de aplicación.

---

## 2. Cómo se identifica el día de la semana

**Decisión**: enum de Prisma `DayOfWeek` con identificadores en inglés (`monday`…`sunday`), traducido
a español en la presentación.

**Rationale**: el repositorio ya usa enums de Prisma para los conjuntos cerrados (`AccountRole`,
`InstructorInvitationStatus`), y un enum ordena por su orden de declaración en Postgres, que es
exactamente el orden de la semana que la grilla necesita. Se elige inglés porque el día de la
semana no es vocabulario del glosario del producto: el Principio VII fija el lenguaje de **roles**,
y ahí sí se respeta el término en español (`administrador`). Las categorías de clase sí son
vocabulario del producto y por eso van en español (§3).

**Alternativas consideradas**: entero 0–6 (ordena bien pero no se lee y admite valores fuera de
rango); cadena libre (sin garantía de conjunto cerrado).

---

## 3. Cómo se representa la categoría

**Decisión**: **dos enums separados** —`ClassAgeGroup { menores, adultos }` y
`ClassLevel { iniciantes, intermedios, avanzados }`— ambos obligatorios en cada clase. En español,
con los términos exactos de la especificación.

**Rationale**: la clarificación fijó que la categoría tiene dos dimensiones combinables, no una
lista plana de seis (FR-008 a FR-010). Dos enums lo expresan directamente, permiten filtrar por una
dimensión sin parsear, y hacen imposible una combinación fuera de conjunto. El español sigue el
precedente de `AccountRole`, que ya guarda `administrador`: son las palabras con las que el negocio
nombra sus cosas, y traducirlas introduciría un diccionario que nadie pidió.

**Alternativas consideradas**: un único enum de seis valores (`menores_iniciantes`, …) — imposible
filtrar por nivel sin parsear la cadena, y crece multiplicativamente si algún día se agrega una
franja etaria; tabla de categorías configurables — la especificación las fija como valores del
producto (Assumptions), así que sería alcance no pedido.

---

## 4. Los tres estados del horario de un día

**Decisión**: una fila por día de la semana en `SkateparkHours`, con `dayOfWeek` único y un booleano
`closed` explícito. Los tres estados quedan:

| Estado | Representación | Efecto |
|---|---|---|
| Sin configurar | no hay fila para ese día | las clases se admiten sin restricción (FR-018) |
| Cerrado | fila con `closed = true` | ninguna clase se admite ese día (FR-015a) |
| Abierto | fila con `closed = false` más apertura y cierre | las clases deben caer dentro (FR-014) |

**Rationale**: la especificación distingue tres estados y dos de ellos —"sin configurar" y
"cerrado"— tienen comportamientos opuestos: el primero permite todo, el segundo no permite nada.
Colapsarlos en "sin horas" haría indistinguible un día que nadie tocó de uno que se cerró a
propósito, y FR-018 dejaría de poder cumplirse.

**Alternativas consideradas**: una única fila con catorce columnas (`mondayOpensAt`,
`mondayClosesAt`, …) — no admite el estado "sin configurar" por día y obliga a migrar el esquema si
cambia la semana; horas nulas como marca de cerrado — pierde la distinción que FR-018 necesita.

---

## 5. Dónde se valida el solapamiento, y qué pasa con dos administradores a la vez

**Decisión**: la regla vive en el dominio, y la comprobación de "¿hay otra clase que se solape?" se
hace **dentro de una transacción** junto con la escritura.

**Rationale**: FR-021 es una regla de negocio, no una restricción de presentación, así que tiene que
sostenerse aunque la petición llegue sin pasar por la pantalla (FR-027). La transacción cierra la
ventana corriente entre "comprobé que no hay conflicto" y "guardé".

**Riesgo residual asumido**: Postgres puede expresar esta invariante de verdad con una restricción
de exclusión sobre un rango, pero Prisma no la modela y habría que escribirla como SQL crudo en la
migración. Se decide **no** hacerlo: el skatepark tiene uno o dos administradores, la ventana es de
milisegundos, y el precio —una restricción invisible para el modelo de Prisma, que el equipo tendría
que recordar al migrar— supera el beneficio. Queda anotado como la ampliación natural si alguna vez
hay concurrencia real.

**Alternativas consideradas**: índice único sobre `(dayOfWeek, startsAt)` — solo impide dos clases
que *empiecen* a la misma hora, no un solapamiento parcial, que es el caso que importa; validar solo
en el navegador — incumple FR-027 de plano.

---

## 6. Qué endpoints hacen falta, y por qué la lectura es una sola

**Decisión**: cinco rutas bajo `/class-schedule`, con **una sola lectura que devuelve la grilla y
los horarios juntos**.

| Ruta | Quién |
|---|---|
| `GET /class-schedule` | staff (instructor y administrador) |
| `POST /class-schedule/classes` | administrador |
| `PUT /class-schedule/classes/:id` | administrador |
| `DELETE /class-schedule/classes/:id` | administrador |
| `PUT /class-schedule/hours/:dayOfWeek` | administrador |

**Rationale**: la sección muestra las dos cosas a la vez y las clases no se pueden validar contra
nada sin los horarios, así que dividir la lectura en dos peticiones solo agregaría un estado
intermedio donde la pantalla tiene la mitad de lo que necesita. Una lectura también hace trivial
mantener el techo de tiempo que 006 fijó para el cambio de destino.

**Alternativas consideradas**: `GET /class-schedule/classes` y `GET /class-schedule/hours` por
separado — dos estados de carga y dos estados de error para una sola pantalla; un endpoint por día
— multiplica peticiones para un volumen de datos que cabe entero en una.

---

## 7. Dos guardias, no una

**Decisión**: `ClassScheduleStaffGuard` (instructor o administrador, para la lectura) y
`ClassScheduleAdminOnlyGuard` (solo administrador, para las cuatro escrituras). Cada uno declara su
propio puerto `CurrentSessionResolver` en el dominio del módulo, con su adaptador en `auth`.

**Rationale**: FR-026 y FR-026a separan configurar de consultar, y esa separación tiene que existir
en el servidor o el rol de solo lectura no significa nada (FR-027). Dos guardias lo hacen legible en
el propio controlador: quien lee la clase ve de un vistazo qué rol exige cada ruta. El puerto propio
por módulo es el patrón que la constitución impone (Principio II) y que 002, 003, 004 y 005 ya
siguen.

**Alternativas consideradas**: una guardia con parámetro de rol — más corta, pero mueve la decisión
de permisos a un argumento fácil de olvidar en una ruta nueva; comprobar el rol dentro de cada caso
de uso — dispersa la misma regla en cuatro lugares.

---

## 8. Cómo se crea y edita una clase en la pantalla

**Decisión**: **hoja modal en el mismo destino**, sin ruta propia y sin superficie anidada.

**Rationale**: el Principio IX admite explícitamente la hoja modal como presentación nativa para un
flujo secundario, y evita agregar entradas a `NESTED_SURFACES` en el mapa de 006. Mantiene vivo el
panel de la grilla debajo, así que volver de crear una clase no recarga ni pierde el día
seleccionado. El camino queda en dos toques: raíz del destino → "Nueva clase" (1) → "Guardar" (2),
por debajo del techo de tres de FR-032.

**Consecuencia registrada**: la hoja **no** tiene dirección propia — no es compartible por enlace y
no aparece como sección aparte. Es coherente con FR-020a de 006, que exige dirección propia para los
destinos y las superficies anidadas, no para las presentaciones en el lugar.

**Pero sí apila una entrada de historial**, con la misma dirección, que se quita al cerrarla. Sin
eso, "atrás" no tendría nada que sacar del entorno de la hoja y saltaría a la entrada anterior, que
desde la raíz de un destino significa **salir del entorno autenticado** (006, FR-022a) — perdiendo
el formulario a medio cargar. Empujar la entrada es el patrón habitual de modal con historial y
cuesta unas pocas líneas; es lo que hace que "atrás" cierre la hoja, que es lo que cualquiera
espera. Se descartó convertirla en superficie anidada con ruta propia (`/schedule/nueva`): agregaría
dos rutas al mapa de 006 para un formulario efímero y desmontaría la grilla debajo.

**Alternativas consideradas**: superficie anidada con dirección propia (`/schedule/nueva`) — sería
compartible, pero agrega dos rutas al mapa de 006 para un formulario efímero y desmonta la grilla;
edición en línea dentro de la fila — no entra a 320 px con cuatro campos.

---

## 9. El selector de día: botones, no pestañas

**Decisión**: una fila de botones, uno por día, con `aria-pressed` marcando el activo. El día que se
muestra al abrir es el actual (FR-001c).

**Rationale**: FR-033 pide alcance y activación por teclado con foco visible, y un botón lo da sin
trabajo extra. El patrón `tablist` sería semánticamente más específico, pero exige `tabindex`
rotatorio y navegación por flechas para no quedar peor que un grupo de botones a medio implementar;
es más maquinaria de la que la base de accesibilidad de esta funcionalidad requiere.

**Alternativas consideradas**: `<select>` nativo — un toque más para ver las opciones y pierde de
vista qué días tienen clases; `role="tablist"` completo — correcto, pero desproporcionado frente a
lo que FR-033 fija.

---

## 10. Estrategia de pruebas

**Decisión**: `bun test` en ambas aplicaciones, siguiendo lo que 006 dejó montado —
`@testing-library/react` con `happy-dom` en el frontend, pruebas de unidad directas en el backend.

**Rationale**: la infraestructura ya existe y ya se usa; 006 dejó 62 pruebas de frontend y 7 de
backend corriendo. Lo que esta funcionalidad aporta es sobre todo **lógica de validación pura**
—solapamiento, límites del horario, día cerrado, horas invertidas—, que se prueba mejor y más
rápido como funciones de dominio que a través de la interfaz.

**Nota**: el objetivo `test` del frontend ya corre con `cwd: apps/frontend`, corregido en 006; sin
eso el preload de happy-dom no se aplica.
