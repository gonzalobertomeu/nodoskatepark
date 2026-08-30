# Quickstart — Validación de la navegación por barra inferior

**Feature**: `006-role-based-bottom-nav`

Guía para levantar el entorno y comprobar de punta a punta que la funcionalidad hace lo que la
especificación exige. No contiene código de implementación: los detalles de forma están en
[`data-model.md`](./data-model.md) y [`contracts/`](./contracts/).

---

## Prerrequisitos

- Docker con Compose. Nada corre en el host (Principio IV).
- Tres cuentas de prueba, una por rol: `skater` (con onboarding completo), `instructor`,
  `administrador`. Una cuarta cuenta `skater` con onboarding **incompleto** para el escenario 8.

## Levantar el entorno

```bash
bun run up          # docker compose up --build — infra + backend + frontend
```

Frontend en `http://localhost:4321`, backend en `http://localhost:3000`.

## Comprobaciones automáticas

```bash
bun run lint        # biome check .
bun nx test frontend    # bun test apps/frontend
bun nx test backend
bun run build       # nx run-many -t build
```

Las pruebas de frontend de esta funcionalidad son las primeras del repositorio; la infraestructura
(`bun test` + `@testing-library/react` + `happy-dom`) ya está declarada y precargada por
`apps/frontend/bunfig.toml`.

---

## Escenarios de validación

### 1. La barra del skater — US1, FR-008, FR-002a

1. Ingresar como `skater`.
2. **Esperado**: aterriza en `/bookings` sin ningún toque adicional ni pantalla intermedia
   (FR-013), presentado como sección en preparación (FR-025).
3. **Esperado**: la barra muestra exactamente tres destinos, en este orden y con estas etiquetas
   literales: **Reservar clases**, **Mi perfil**, **Configuración** (FR-002a), cada uno con icono
   y texto.
4. Tocar cada destino. **Esperado**: la sección correspondiente aparece, ese destino queda
   marcado, y la barra no se mueve ni parpadea.

### 2. La barra del staff — US2, FR-009, FR-010

1. Ingresar como `administrador`. **Esperado**: destinos **Skaters**, **Staff**,
   **Horarios de clases**; ningún destino de skater.
2. Cerrar sesión e ingresar como `instructor`. **Esperado**: destinos **Skaters** y
   **Horarios de clases**; **Staff no aparece**.

### 3. Estado conservado al cambiar de destino — US3, FR-019, SC-002

1. Como `administrador`, ir a **Skaters**, escribir algo en la búsqueda y desplazarse hasta el
   final del listado.
2. Tocar **Staff**, luego volver a **Skaters**.
3. **Esperado**: el texto de búsqueda, los resultados filtrados y la posición de desplazamiento
   están tal como se dejaron. En ningún momento hubo pantalla en blanco.

### 4. Techo de tiempo — FR-020c, SC-002b

Con el panel de rendimiento del navegador abierto, o midiendo con marcas:

```js
// En la consola, antes de tocar el destino:
performance.mark('nav-start');
// Tras verlo pintado:
performance.mark('nav-end');
performance.measure('nav', 'nav-start', 'nav-end').duration;
```

- **Destino ya visitado**: ≤ 100 ms.
- **Primera visita**: encabezado y esqueleto visibles en ≤ 100 ms; datos reales en ≤ 1 s.

Comprobación estructural equivalente, cubierta por prueba: tras cambiar de destino, el panel del
destino anterior **sigue presente en el DOM**, oculto. Si se desmonta, el techo no se sostiene.

### 5. Direcciones compartibles y recarga — FR-020a, FR-020b, SC-002a

1. Copiar la dirección de cada destino y de cada superficie anidada
   (`/skaters/profile?accountId=…`, `/staff/instructors`) y abrirla en una pestaña nueva.
2. **Esperado**: llega directo a esa sección, con la barra puesta y el destino correcto marcado.
3. **Esperado tras una recarga completa (F5)**: se conserva la sección; la posición de
   desplazamiento y los filtros pueden perderse — eso es correcto (FR-020b).

### 6. "Atrás" del dispositivo — FR-022a, FR-022b

1. Como `administrador`: **Skaters** → **Staff** → **Skaters** → **Staff**.
2. Pulsar "atrás". **Esperado**: **no** vuelve a Skaters (FR-022b).
3. Desde **Staff**, abrir **Asignar instructor** (`/staff/instructors`) y pulsar "atrás".
   **Esperado**: vuelve a `/staff`, igual que la flecha en pantalla.
4. Desde la raíz de un destino, pulsar "atrás". **Esperado**: sale del entorno autenticado.

### 7. Tres toques — FR-021, SC-001, US2 escenario 4

Desde `/staff`: "Asignar instructor" (1) → "Promover" en una fila (2). **Esperado**: ≤ 3 toques.
Desde `/skaters`: fila del skater (1) → "Editar" (2). **Esperado**: ≤ 3 toques.

### 8. Onboarding bloqueante — FR-005

1. Ingresar con el skater de onboarding incompleto.
2. **Esperado**: va a `/onboarding` y **la barra no se dibuja**. Intentar abrir `/profile` o
   `/settings` directamente devuelve al onboarding.
3. Comprobar también que la barra no aparece en `/login`, `/register`, `/forgot-password`,
   `/reset-password` ni `/verify-email`.

### 9. Cuenta propia y cierre de sesión — FR-015, FR-016, FR-017, FR-018a

1. Como `administrador` o `instructor`: el elemento de cuenta del encabezado está presente en
   **todas** las secciones; abrirlo muestra los datos de la cuenta y el cierre de sesión, y **no**
   ofrece navegación a otras secciones (FR-017).
2. Como `skater`: **Configuración** muestra el email de la cuenta, la acción "Cambiar contraseña"
   y el cierre de sesión — con contenido real, nunca como sección en preparación (FR-018).
3. **Mi perfil** muestra y edita los datos del skatepark (nombre, apellido, fecha de nacimiento).
   **Esperado**: ningún dato aparece en los dos destinos (FR-018a, SC-009).

### 10. Cambio de rol con la sesión activa — FR-014, FR-014a, US2 escenario 6

1. Con un `administrador` viendo `/staff`, degradar esa cuenta a `instructor` desde otra sesión o
   directamente en la base de datos.
2. En la sesión afectada, provocar cualquier interacción con el servidor (cambiar de destino o
   recargar los datos).
3. **Esperado**: la barra se recompone con los destinos de instructor, la persona es llevada al
   primer destino de ese rol y se le explica por qué dejó de ver el listado de staff. No se cierra
   su sesión ni queda en una sección perdida.

### 11. El control de acceso es del servidor — FR-012, SC-005

Con la sesión de `instructor` activa, llamar directamente al backend:

```bash
curl -i -b "<cookie de sesión del instructor>" http://localhost:3000/staff-directory
```

**Esperado**: el servidor rechaza (403), independientemente de que la barra nunca haya ofrecido
ese destino. Repetir con una cookie de `skater` contra las superficies de staff.

### 12. Fallo de datos — FR-024a, FR-024b, SC-010

1. Cortar la red del navegador (DevTools → Network → Offline) y abrir **Skaters**.
2. **Esperado**: el error aparece **dentro** del destino, con opción de reintentar; la barra sigue
   visible y permite irse a otro destino con un solo toque; no se reemplaza la aplicación entera.
3. **Esperado**: el mensaje de error **no** se parece al de sección en preparación (FR-024b).

### 13. Sesión expirada — FR-024

Borrar la cookie de sesión y provocar una interacción. **Esperado**: sale a `/login`; no queda una
sección con la barra visible y sin datos.

### 14. Accesibilidad — FR-027a, FR-027b, FR-027c, SC-006a

1. Con un lector de pantalla: la barra se anuncia como navegación y el destino activo se anuncia
   como tal (`aria-current`), no solo por color.
2. Solo con teclado: `Tab` alcanza los seis destinos con anillo de foco visible; `Enter` los
   activa. Repetir a ancho de escritorio, con el riel lateral.
3. Tras cambiar de destino o subir un nivel, comprobar `document.activeElement`. **Esperado**: es
   el encabezado de la sección nueva, nunca un elemento que ya no está en pantalla.

### 15. Pantallas grandes y anchos angostos — US5, FR-029, FR-030, FR-031, SC-006, SC-007

1. A 1280 px: la navegación se presenta como riel lateral con **los mismos destinos, en el mismo
   orden y a la misma profundidad**.
2. A 320 px: ninguna sección requiere desplazamiento horizontal, y las etiquetas de la barra
   siguen legibles y sin superponerse.
3. En un dispositivo con recorte o indicador de inicio: la barra respeta las áreas seguras
   (FR-028).

### 16. Tocar el destino activo — FR-006

Con búsqueda escrita y desplazamiento hecho en **Skaters**, tocar **Skaters** otra vez.
**Esperado**: no pasa nada; el estado de la sección no se reinicia ni se vacía.

---

## Criterio de aceptación de la guía

La funcionalidad está lista cuando los dieciséis escenarios pasan en las tres cuentas de rol, `bun
run lint` y `bun nx test frontend` están en verde, y ningún destino de la barra produce un error
al abrirlo — incluidos los dos que están en preparación (SC-008).
