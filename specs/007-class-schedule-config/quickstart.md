# Quickstart — Validación del calendario de clases

**Feature**: `007-class-schedule-config`

Cómo levantar el entorno y comprobar de punta a punta que la funcionalidad hace lo que la
especificación exige. Sin código de implementación: las formas están en
[`data-model.md`](./data-model.md) y [`contracts/`](./contracts/).

---

## Prerrequisitos

- Docker con Compose. Nada corre en el host (Principio IV).
- Una cuenta `administrador` y una `instructor`, ambas verificadas. Si no las tenés, el camino es:
  registrar por `POST /auth/register`, tomar el enlace de verificación (con `EMAIL_ADAPTER=dev`
  aparece en los logs del backend; con `resend` llega por correo), verificar, y asignar el rol en la
  base. Ninguna cuenta puede llegar a `administrador` desde la aplicación.

## Levantar el entorno

```bash
bun run up          # infra + backend + frontend
```

La migración de esta funcionalidad se aplica sola al arrancar: el comando del contenedor de backend
ya corre `prisma migrate deploy`.

## Comprobaciones automáticas

```bash
bun run lint
bun nx test backend
bun nx test frontend
bun run build
```

---

## Escenarios de validación

### 1. Armar la grilla — US1, FR-002, FR-003

1. Ingresar como `administrador` y tocar **Horarios de clases**.
2. **Esperado**: la sección muestra el día actual con un estado explícito de "sin clases", nunca una
   pantalla en blanco (FR-005, FR-001c).
3. Crear una clase: martes, 17:00 a 18:00, menores iniciantes.
4. **Esperado**: al indicar 17:00, el formulario propone 18:00 —una hora— y se puede cambiar
   (FR-003). La clase aparece en el martes y sobrevive a una recarga (FR-006).
5. Crear una segunda clase el jueves, adultos avanzados.
6. **Esperado**: ambas se distinguen por su categoría sin abrirlas (FR-004).

### 2. Un día por vez en el teléfono — FR-001a, FR-001c, SC-005a

1. A 320 px de ancho, abrir la sección.
2. **Esperado**: se ven las clases de **un solo día**, como lista vertical ordenada por hora, con el
   selector de día arriba. Sin desplazamiento horizontal en ningún punto.
3. Tocar otro día. **Esperado**: cambia con un solo toque.
4. A 1280 px. **Esperado**: la semana completa en columnas, con **las mismas clases y la misma
   cantidad de toques** hasta cada acción (FR-001b, SC-005a).

### 3. Horario del skatepark por día — US2, FR-013, FR-015

1. Configurar el lunes de 14:00 a 22:00.
2. Intentar crear una clase el lunes de 09:00 a 10:00. **Esperado**: rechazo con
   `outside_opening_hours`, explicando que queda fuera del horario de ese día.
3. Crear una el lunes de 15:00 a 16:00. **Esperado**: se guarda.
4. Configurar el lunes con cierre a las 13:00 y apertura a las 14:00. **Esperado**: rechazo
   `invalid_input` (FR-017).

### 4. Día cerrado — FR-015a, FR-016

1. Marcar el domingo como cerrado.
2. Intentar crear una clase el domingo. **Esperado**: rechazo `day_closed`.
3. Con una clase ya cargada el lunes a las 15:00, intentar marcar el lunes como cerrado.
4. **Esperado**: el cambio **no se aplica**, y el sistema **nombra la clase** que lo impide
   (FR-016). No la borra ni la mueve.

### 5. Día sin configurar — FR-018

1. Sin haber tocado el horario del miércoles, crear una clase ese día a cualquier hora.
2. **Esperado**: se guarda, y la sección indica que el horario del miércoles todavía no está
   definido. Ojo: esto es distinto de "cerrado" — un día sin configurar admite todo.

### 6. Una clase por vez — FR-021

1. Con la clase del martes de 17:00 a 18:00, crear otra el martes de 17:30 a 18:30.
2. **Esperado**: rechazo `overlap_conflict`, **indicando con cuál choca**.
3. Repetir con una categoría distinta —adultos avanzados—. **Esperado**: se rechaza igual. El
   skatepark dicta una clase por vez, sin importar la categoría.

### 7. Corregir y eliminar — US3, FR-023, FR-024, FR-025

1. Cambiar la clase del martes a las 19:00 y a adultos intermedios. **Esperado**: la grilla lo
   refleja y se aplican las mismas validaciones que a la creación.
2. Eliminarla. **Esperado**: pide confirmación explícita antes de borrar, y luego desaparece.

### 8. Tres toques — FR-032, SC-004

Desde la raíz del destino: **Nueva clase** (1) → **Guardar** (2). Editar: tocar la clase (1) →
**Guardar** (2). Horario: **Horario del skatepark** (1) → **Guardar** (2). Todos por debajo del
techo de tres.

### 9. El instructor consulta y no modifica — US4, FR-026a

1. Ingresar como `instructor` y abrir **Horarios de clases**.
2. **Esperado**: ve la grilla completa con clases, horarios y categorías.
3. **Esperado**: **no encuentra ninguna acción** para crear, editar o eliminar, ni para tocar el
   horario del skatepark (FR-028).

### 10. El servidor rechaza igual — FR-027, SC-007

Con la cookie de sesión de un instructor:

```bash
curl -i -X POST http://localhost:3000/class-schedule/classes \
  -H 'Content-Type: application/json' -b "<cookie del instructor>" \
  -d '{"dayOfWeek":"monday","startsAtMinute":900,"endsAtMinute":960,"ageGroup":"menores","level":"iniciantes"}'
```

**Esperado**: `403 forbidden`, aunque la pantalla nunca le haya ofrecido la acción. Repetir con una
cookie de skater contra `GET /class-schedule`: también `403`.

### 11. La hora no se mueve nunca — FR-018a

1. Con clases cargadas, cambiar la zona horaria del sistema operativo del navegador a otra bien
   distinta (por ejemplo UTC+9) y recargar.
2. **Esperado**: todas las clases siguen mostrando **exactamente la misma hora**. Nada se corre.
3. Comprobación equivalente en la base: las horas se guardan como enteros de minutos, no como
   fechas, así que no hay conversión posible.

### 12. Sin historial — FR-025a

1. Cambiar el horario de una clase.
2. **Esperado**: no hay ninguna forma de consultar cómo era antes. La grilla describe la
   configuración vigente y nada más.

### 13. Estados de carga y de error — heredados de 006

1. Con la red cortada, abrir la sección. **Esperado**: el error aparece **dentro** del destino, con
   reintento, y la barra sigue permitiendo cambiar de destino con un solo toque.
2. Cambiar a otro destino y volver. **Esperado**: el día seleccionado y el desplazamiento se
   conservan; el panel nunca se desmontó.

### 14. Accesibilidad — FR-004a, FR-022a, FR-033, FR-034, SC-006a

1. Solo con teclado: alcanzar y activar el selector de día, crear, editar, eliminar y el horario del
   skatepark, con foco visible en todo momento.
2. Con lector de pantalla: cada clase se anuncia con su día, su hora y su categoría en texto —la
   categoría nunca solo por color.
3. Provocar un rechazo de validación. **Esperado**: se anuncia, y el foco pasa al campo a corregir.
4. Comprobar que cada campo de los formularios tiene su etiqueta asociada.

---

## Criterio de aceptación de la guía

La funcionalidad está lista cuando los catorce escenarios pasan con las dos cuentas de rol,
`bun run lint` y ambas suites de pruebas están en verde, y ninguna configuración inválida logra
guardarse por ninguna vía.
