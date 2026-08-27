# Phase 0 — Research: Navegación Principal por Barra Inferior según Rol

**Feature**: `006-role-based-bottom-nav` | **Date**: 2026-08-27

Todas las incógnitas del Technical Context quedan resueltas aquí. Cada punto registra la
decisión, por qué se eligió y qué alternativas se descartaron.

---

## 1. Cómo tener un caparazón persistente sin recarga completa con Astro `output: 'static'`

**Decisión**: mantener `output: 'static'` y montar un **caparazón React único** (`AppShell`) que
posee la navegación del entorno autenticado. Astro genera una página HTML por cada ruta
direccionable (las ocho son conocidas en tiempo de compilación), y todas renderizan el mismo
`<AppShell initialPath="…" client:load />`. La entrada directa a una dirección la sirve el HTML
prerenderizado correspondiente; a partir de la hidratación, todo cambio de destino ocurre en el
cliente con la History API, sin pedir un documento nuevo.

**Rationale**: satisface las dos exigencias que hoy están en conflicto — FR-020a (cada destino y
cada superficie anidada con su propia dirección, abrible y recargable) y FR-020/FR-020c (sin
recarga completa, sin intervalo en blanco, ≤100 ms al volver). Como el conjunto de rutas es fijo
y pequeño, el prerender estático no cuesta nada. No obliga a introducir SSR ni un adaptador de
servidor, así que el `Dockerfile` y el despliegue actuales siguen valiendo (Principio IV).

**Alternativas consideradas**:
- **`<ViewTransitions />` / ClientRouter de Astro**: navega sin recarga de documento, pero
  re-monta las islas React en cada navegación, así que el estado de la vista y la posición de
  desplazamiento se pierden — incumple FR-019. `transition:persist` conserva una isla solo si la
  misma isla existe en ambas páginas, lo que no permite mantener vivos varios destinos a la vez.
- **Cambiar a `output: 'server'` con adaptador**: resolvería el guardado de sesión en servidor,
  pero agrega un runtime de servidor al frontend, cambia Dockerfile y compose, y no es necesario:
  la comprobación de sesión ya se hace en el cliente en todo el producto (`SessionRedirectGuard`,
  `MainAppPlaceholder`). Coste alto, beneficio nulo para esta funcionalidad.
- **Una sola ruta SPA (`/app#/destino`)**: rompería FR-020a — las direcciones con fragmento no
  son buenas direcciones compartibles y no permiten prerender por sección.

---

## 2. Enrutado: biblioteca frente a implementación propia

**Decisión**: **router propio mínimo** sobre la History API (`apps/frontend/src/app/router.ts`),
sin agregar dependencias.

**Rationale**: dos exigencias de esta funcionalidad chocan de frente con el modelo de un router
convencional:

1. **FR-019 exige mantener vivos los destinos visitados.** Un router estándar desmonta el
   componente de la ruta anterior al cambiar; recuperar el estado obligaría a construir igualmente
   un contenedor "keep-alive" por encima de él. La biblioteca no ahorra ese trabajo, lo estorba.
2. **FR-022b exige que cambiar de destino NO apile historial** (`replaceState`) mientras que abrir
   una superficie anidada SÍ lo apila (`pushState`). Es una semántica poco habitual que hay que
   escribir explícitamente en cualquier caso.

Lo que queda del router —leer `location.pathname`, escuchar `popstate`, empujar o reemplazar— son
unas ochenta líneas. Agregar `react-router` para eso contradice el criterio de mínima dependencia
del monorepo (Principio V) sin resolver ninguno de los dos puntos difíciles.

**Alternativas consideradas**: `react-router-dom` v6 (descartado por lo anterior);
`wouter` (más liviano, pero mismo problema de desmontaje).

---

## 3. Conservar desplazamiento y estado de la vista al cambiar de destino

**Decisión**: `DestinationHost` renderiza **un panel por destino ya visitado** y oculta los
inactivos con `display: none`. Cada panel es **su propio contenedor de desplazamiento**
(`overflow-y: auto`); el `body` no se desplaza.

**Rationale**: mantener el nodo montado conserva el estado de React (texto de búsqueda, página,
resultados) sin ninguna contabilidad manual, y mantener el desplazamiento dentro del panel hace
que `scrollTop` sobreviva a `display: none` de forma nativa en los navegadores actuales — no hace
falta guardar y restaurar posiciones. Volver a un destino ya visitado es un cambio de clase CSS,
que es lo que hace alcanzable el techo de 100 ms de FR-020c sin montar nada por adelantado.

**Alternativas consideradas**:
- Guardar `scrollTop` en un `Map` y restaurarlo tras el montaje: reintroduce el parpadeo y una
  recarga de datos en cada vuelta; incumple el espíritu de FR-020.
- Montar los tres destinos al iniciar sesión: descartado explícitamente en la clarificación de
  FR-020c (alarga el ingreso y trae datos que quizá nadie mire).

---

## 4. De dónde sale el email de la cuenta para el destino "Configuración"

**Decisión**: **extender el contrato existente `GET /auth/session`** con el campo `email` en su
rama autenticada. No se crea ningún endpoint nuevo.

**Rationale**: FR-018a obliga a que "Configuración" presente los datos de la cuenta, y el email es
uno de ellos; hoy `sessionResponseSchema` solo devuelve `{ authenticated, role }`. El dato ya está
cargado en el servidor en el punto exacto donde se resuelve la sesión: `ValidateSessionUseCase` ya
trae la entidad `Account` completa (que incluye `email`) para comprobar `status`, así que
propagarlo es agregar un campo, no una consulta. Extender el contrato vigente en lugar de crear
uno nuevo respeta el Principio III y no contradice FR-007a, que solo prohíbe que el servidor sea
la fuente de la *lista de destinos*.

**Alcance del cambio** (tres archivos de backend, uno de contratos):
`packages/contracts/src/auth/session.contract.ts` → `ValidatedSession` en
`validate-session.use-case.ts` → `AuthenticatedRequest` en `session.guard.ts` → respuesta de
`getSession` en `auth.controller.ts`.

**Alternativas consideradas**: un `GET /account/me` nuevo (más superficie de API para un único
campo que ya viaja en la sesión); mostrar "Configuración" sin el email (incumple FR-018a).

---

## 5. Qué significa "presentar la contraseña" en Configuración

**Decisión**: "Configuración" presenta una acción **"Cambiar contraseña"** que reutiliza el flujo
ya existente `POST /auth/password-reset/request` con el email de la propia cuenta, y muestra la
confirmación de que se envió el enlace.

**Rationale**: una contraseña no se muestra; lo que FR-018a pide presentar es la contraseña como
dato de cuenta *gestionable*. El flujo de recuperación ya existe, ya está detrás del puerto
`EmailSender` con Resend (Principio VIII) y ya verifica la titularidad del email. Reutilizarlo
cumple el requisito sin agregar ningún endpoint ni ninguna ruta de credenciales nueva.

**Alternativas consideradas**: un `POST /auth/password/change` con contraseña actual + nueva
(mejor experiencia, pero es superficie de autenticación nueva y no especificada — corresponde a
una funcionalidad propia); mostrar un campo enmascarado inerte (teatro, no un dato gestionable).

---

## 6. Revalidación del rol y expiración de sesión sin sondeo

**Decisión**: un `SessionProvider` propietario del estado `{ authenticated, role, email }` que
**revalida llamando a `GET /auth/session` en cada cambio de destino** y cuando un destino informa
un fallo de autorización. Sin temporizadores, sin sondeo, sin canal empujado.

**Rationale**: FR-014 fija exactamente ese momento — "la siguiente interacción con el servidor" —
y prohíbe el sondeo. El cambio de destino es la interacción natural y barata. Si el rol devuelto
difiere del vigente, el proveedor recompone el conjunto de destinos; si el destino actual dejó de
pertenecer al rol nuevo, el caparazón reemplaza la ubicación por el primer destino del rol nuevo y
muestra el motivo (FR-014a). Si la respuesta es `authenticated: false`, sale a `/login` (FR-024).

**Alternativas consideradas**: sondeo por intervalo (prohibido por FR-014); SSE/WebSocket
(prohibido por FR-014 y superficie de infraestructura nueva); revalidar solo al recargar (deja la
barra desactualizada durante toda la sesión).

---

## 7. El control de acceso sigue siendo del servidor

**Decisión**: esta funcionalidad **no agrega ni modifica ninguna comprobación de permisos en el
servidor**. Ocultar un destino es presentación; el rechazo lo siguen aplicando los guardias ya
existentes de cada módulo. La tarea asociada es de **verificación**, no de implementación:
comprobar con pruebas que `GET /staff-directory` rechaza a un instructor y que las superficies de
staff rechazan a un skater.

**Rationale**: FR-012 lo exige literalmente y es la parte del diseño donde un atajo se convierte en
un agujero. Dejarlo como verificación explícita evita que "la barra no lo muestra" se confunda con
"el sistema lo impide".

---

## 8. Accesibilidad: exposición, teclado y foco

**Decisión**:
- La barra es un `<nav aria-label="Navegación principal">` con una lista de enlaces reales
  (`<a href>`), no botones: el teclado y las tecnologías de asistencia los reconocen sin trabajo
  extra, y siguen siendo direcciones compartibles.
- El destino activo lleva `aria-current="page"` además de la distinción visual (FR-027a: nunca
  solo color o forma).
- El encabezado de cada sección es un `<h1 tabIndex={-1}>`; al cambiar de destino o subir un
  nivel, el caparazón le hace `focus()` (FR-027c).
- Los enlaces conservan un anillo de foco visible propio, no `outline: none` (FR-027b), también
  en la presentación de riel lateral.

**Rationale**: usar enlaces en lugar de botones resuelve simultáneamente FR-020a, FR-027b y el
comportamiento esperado de "abrir en pestaña nueva"; el `preventDefault` del router solo intercepta
el clic primario sin modificadores.

---

## 9. Presentación en tablet y escritorio

**Decisión**: el mismo componente `BottomNav` se re-presenta como **riel lateral izquierdo** a
partir de 1024 px mediante una consulta de medios en `app-shell.css`. Mismo orden, mismas
etiquetas, mismos enlaces, misma profundidad.

**Rationale**: FR-030 y FR-031 exigen una única arquitectura de información; reutilizar el mismo
componente y cambiar solo su disposición hace estructuralmente imposible que los conjuntos
diverjan entre anchos. Un componente separado para escritorio sería justo el error que SC-007
existe para detectar.

---

## 10. Cómo se comprueba el techo de 100 ms / 1 s

**Decisión**: procedimiento manual documentado en `quickstart.md`, con el panel de rendimiento del
navegador: se marca `performance.mark()` al despachar la navegación y al pintar el destino, y se
lee la diferencia. No se introduce ninguna herramienta de medición ni presupuesto automatizado.

**Rationale**: el repositorio no tiene hoy infraestructura de pruebas de rendimiento y montarla
excedería el alcance de esta funcionalidad. El diseño elegido (paneles vivos, cambio por CSS) hace
que volver a un destino visitado sea trivialmente inferior a 100 ms; lo que hay que comprobar es
que nadie introduzca un desmontaje, y para eso alcanza una comprobación manual más una prueba que
verifique que el panel anterior sigue en el DOM tras cambiar de destino.

---

## 11. Estrategia de pruebas

**Decisión**: `bun test` con `@testing-library/react` y `happy-dom`, que ya están declarados en
`apps/frontend/package.json` y precargados por `apps/frontend/bunfig.toml` (`test/setup.ts`).
Estas serían **las primeras pruebas del repositorio**: hoy no existe ningún archivo `*.test.ts(x)`.

**Rationale**: la infraestructura ya está instalada y sin usar; no hay que elegir nada nuevo. Las
pruebas de esta funcionalidad son de comportamiento observable (qué destinos se dibujan por rol,
qué etiquetas literales, qué pasa al cambiar de destino, qué se ve en un destino en preparación o
en error), que es exactamente lo que Testing Library expresa bien.

**Nota de alcance**: introducir pruebas donde no había ninguna implica también agregar el objetivo
`test` real al flujo; `apps/frontend/project.json` ya define `bun test apps/frontend`, así que no
hay configuración nueva que crear.
