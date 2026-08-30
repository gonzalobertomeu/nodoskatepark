# Phase 1 — Data Model: Configuración del Calendario de Clases

**Feature**: `007-class-schedule-config` | **Date**: 2026-08-28

Esta funcionalidad **sí** introduce esquema nuevo: dos modelos y tres enums, en una migración de
Prisma. Es la primera vez que el producto guarda algo que no es una cuenta o una sesión.

---

## Enums

```prisma
enum DayOfWeek {
  monday
  tuesday
  wednesday
  thursday
  friday
  saturday
  sunday
}

enum ClassAgeGroup {
  menores
  adultos
}

enum ClassLevel {
  iniciantes
  intermedios
  avanzados
}
```

El orden de declaración de `DayOfWeek` **es** el orden de la semana: Postgres ordena un enum por su
posición, así que `ORDER BY "dayOfWeek"` devuelve la grilla en orden sin ninguna tabla de
traducción. Los identificadores van en inglés porque el día de la semana no es vocabulario del
producto; las categorías van en español porque sí lo son (research.md §2 y §3).

---

## 1. `ScheduledClass` — Clase semanal

```prisma
model ScheduledClass {
  id             String        @id @default(uuid())
  dayOfWeek      DayOfWeek
  startsAtMinute Int
  endsAtMinute   Int
  ageGroup       ClassAgeGroup
  level          ClassLevel
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([dayOfWeek, startsAtMinute])
  @@map("scheduled_classes")
}
```

| Campo | Regla |
|---|---|
| `dayOfWeek` | Obligatorio. La clase rige ese día todas las semanas (FR-007). |
| `startsAtMinute` | Minutos desde medianoche, 0–1439. Hora local de reloj de pared (FR-018a). |
| `endsAtMinute` | Minutos desde medianoche, 1–1440. MUST ser mayor que `startsAtMinute` (FR-019). |
| `ageGroup` | Obligatorio (FR-009, FR-011). |
| `level` | Obligatorio (FR-010, FR-011). |

**Reglas de validación** (todas comprobables como funciones puras de dominio)

- `0 <= startsAtMinute < endsAtMinute <= 1440` — cubre FR-019 y FR-020 a la vez: al no existir un
  campo de fecha, una clase no puede cruzar la medianoche ni siquiera representarse.
- **Sin solapamiento**: para dos clases del mismo `dayOfWeek`, `aStart < bEnd && bStart < aEnd` es
  conflicto. Se rechaza **aunque las categorías difieran** (FR-021).
- **Dentro del horario**: si existe fila de `SkateparkHours` para ese día y `closed = false`,
  entonces `opensAtMinute <= startsAtMinute` y `endsAtMinute <= closesAtMinute` (FR-014, FR-015).
- **Día cerrado**: si la fila existe con `closed = true`, ninguna clase se admite (FR-015a).
- **Día sin configurar**: si no hay fila, no se aplica ninguna restricción de horario (FR-018).

**Sin ciclo de vida ni historial.** La entidad solo existe en su versión vigente: una edición pisa
los valores anteriores y una eliminación la borra (FR-025a). No hay borrado en blando, no hay
fechas de vigencia, y qué ocurrió efectivamente un día es dato de la funcionalidad de asistencia
(FR-025b). `createdAt` y `updatedAt` son metadatos operativos, no un historial consultable.

**Sin relaciones.** No apunta a ninguna cuenta: la clase no tiene instructor asignado ni asistentes,
que es la exclusión de alcance de FR-029.

---

## 2. `SkateparkHours` — Horario del skatepark

```prisma
model SkateparkHours {
  dayOfWeek       DayOfWeek @id
  closed          Boolean   @default(false)
  opensAtMinute   Int?
  closesAtMinute  Int?
  updatedAt       DateTime  @updatedAt

  @@map("skatepark_hours")
}
```

`dayOfWeek` es la clave primaria: hay como mucho una fila por día, y la unicidad no necesita índice
aparte.

**Los tres estados, y por qué importan** (research.md §4)

| Estado | Fila | Efecto sobre las clases de ese día |
|---|---|---|
| Sin configurar | no existe | se admiten sin restricción de horario (FR-018) |
| Cerrado | `closed = true` | ninguna se admite (FR-015a) |
| Abierto | `closed = false`, con ambas horas | deben caer dentro del rango (FR-014) |

Colapsar "sin configurar" y "cerrado" haría indistinguible un día que nadie tocó de uno cerrado a
propósito, y son opuestos: uno permite todo, el otro nada.

**Reglas de validación**

- Si `closed = false`, ambas horas MUST estar presentes y `opensAtMinute < closesAtMinute`
  (FR-017).
- Si `closed = true`, ambas horas MUST ser nulas: un día cerrado no tiene horario que mostrar.
- **Cambio que dejaría clases afuera**: achicar el rango o marcar el día como cerrado MUST
  rechazarse si alguna clase de ese día quedaría fuera, nombrando cuáles (FR-016). El sistema nunca
  borra ni mueve una clase por su cuenta.

---

## 3. Formas de lectura y escritura

Lo que la sección consume y produce vive en `packages/contracts/src/class-schedule/`. Ver
[contracts/class-schedule-endpoints.md](./contracts/class-schedule-endpoints.md).

**Frontera de formato**: dentro del sistema una hora es siempre un entero de minutos. La conversión
a `"HH:MM"` ocurre **solo en la presentación**, al pintar y al leer el campo del formulario. Ningún
contrato ni ninguna capa intermedia transporta cadenas de hora, para que no exista un punto donde
alguien pueda reinterpretarlas con una zona horaria.

---

## 4. Estado de la sección en el navegador

No se persiste; vive mientras vive el panel del destino.

| Campo | Nota |
|---|---|
| `selectedDay` | Día que muestra el selector. Arranca en el día actual (FR-001c). |
| `sheet` | `null`, `{ mode: 'create' }`, `{ mode: 'edit', classId }` o `{ mode: 'hours', day }`. Hoja modal, sin dirección propia (research.md §8). |
| `schedule` | Clases y horarios traídos en una sola lectura. |
| `error` | Fallo de carga, presentado dentro del destino con reintento, según el patrón que 006 dejó. |

El panel del destino `schedule` queda **montado** al cambiar a otro destino, como todos, así que
volver conserva el día seleccionado y la posición de desplazamiento sin trabajo adicional
(006, FR-019).
