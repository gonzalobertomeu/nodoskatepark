# Contract — `/class-schedule`

**Feature**: `007-class-schedule-config` | **Package**:
`packages/contracts/src/class-schedule/` (nuevo)

Cinco rutas. La lectura la puede hacer cualquier cuenta de staff; las cuatro escrituras son
exclusivas de administrador (FR-026, FR-026a). El control lo aplican dos guardias distintas en el
servidor, y no depende de que la pantalla oculte una acción (FR-027).

Todas las horas viajan como **minutos desde medianoche**, enteros de 0 a 1440. Nunca como cadena ni
como fecha: es lo que hace que un cambio de horario estacional no pueda desplazar la grilla
(FR-018a, research.md §1).

---

## Tipos compartidos

```ts
export const dayOfWeekSchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]);

export const classAgeGroupSchema = z.enum(['menores', 'adultos']);
export const classLevelSchema = z.enum(['iniciantes', 'intermedios', 'avanzados']);

export const scheduledClassSchema = z.object({
  id: z.string(),
  dayOfWeek: dayOfWeekSchema,
  startsAtMinute: z.number().int().min(0).max(1439),
  endsAtMinute: z.number().int().min(1).max(1440),
  ageGroup: classAgeGroupSchema,
  level: classLevelSchema,
});

export const skateparkDayHoursSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  closed: z.boolean(),
  opensAtMinute: z.number().int().min(0).max(1439).nullable(),
  closesAtMinute: z.number().int().min(1).max(1440).nullable(),
});
```

Los rangos van en el esquema porque son propiedades del **formato** —un minuto del día— y no reglas
de negocio. Las reglas (fin después del inicio, sin solapamiento, dentro del horario) viven en el
dominio y responden con un error de contrato, no con un `ZodError` sin manejar. Es el mismo criterio
que `skater-profile` documentó para `nombre`/`apellido`.

---

## `GET /class-schedule` — leer la grilla completa

**Permiso**: instructor o administrador.

```ts
export const getClassScheduleResponseSchema = z.object({
  classes: z.array(scheduledClassSchema),
  hours: z.array(skateparkDayHoursSchema),
});
```

Devuelve las dos cosas en una sola lectura: la sección las muestra juntas y las clases no se validan
contra nada sin los horarios (research.md §6). `hours` trae **solo los días configurados**; un día
ausente está sin configurar, que no es lo mismo que cerrado (FR-018).

`classes` viene ordenado por día y luego por hora de inicio, para que la pantalla no tenga que
reordenar.

---

## `POST /class-schedule/classes` — crear una clase

**Permiso**: administrador.

```ts
export const createScheduledClassRequestSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  startsAtMinute: z.number().int().min(0).max(1439),
  endsAtMinute: z.number().int().min(1).max(1440),
  ageGroup: classAgeGroupSchema,
  level: classLevelSchema,
});
```

Responde `201` con la clase creada (`scheduledClassSchema`).

---

## `PUT /class-schedule/classes/:id` — modificar una clase

**Permiso**: administrador. Cuerpo idéntico al de creación: la edición reemplaza los cuatro
atributos y pasa por las mismas validaciones (FR-025). Responde `200` con la clase actualizada.

---

## `DELETE /class-schedule/classes/:id` — eliminar una clase

**Permiso**: administrador. Responde `200` con `{ status: 'ok' }`. La confirmación previa es de la
pantalla (FR-024); el servidor no la simula.

---

## `PUT /class-schedule/hours/:dayOfWeek` — configurar el horario de un día

**Permiso**: administrador.

```ts
export const setSkateparkDayHoursRequestSchema = z.discriminatedUnion('closed', [
  z.object({ closed: z.literal(true) }),
  z.object({
    closed: z.literal(false),
    opensAtMinute: z.number().int().min(0).max(1439),
    closesAtMinute: z.number().int().min(1).max(1440),
  }),
]);
```

La unión discriminada hace **imposible por tipo** enviar un día cerrado con horas, o un día abierto
sin ellas — dos de las reglas de `data-model.md` §2 quedan resueltas antes de llegar al dominio.

Responde `200` con el día actualizado (`skateparkDayHoursSchema`).

---

## Errores

```ts
export const ClassScheduleErrorCode = {
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  InvalidInput: 'invalid_input',
  OverlapConflict: 'overlap_conflict',
  OutsideOpeningHours: 'outside_opening_hours',
  DayClosed: 'day_closed',
  HoursChangeConflict: 'hours_change_conflict',
} as const;
```

| Código | HTTP | Cuándo | Requisito |
|---|---|---|---|
| `unauthenticated` | 401 | sin sesión válida | — |
| `forbidden` | 403 | instructor o skater intentando escribir | FR-026, FR-027 |
| `not_found` | 404 | el id de clase no existe | FR-023, FR-024 |
| `invalid_input` | 400 | fin anterior o igual al inicio; cierre anterior o igual a la apertura | FR-017, FR-019 |
| `overlap_conflict` | 409 | se solapa con otra clase del mismo día | FR-021 |
| `outside_opening_hours` | 409 | fuera del horario configurado para ese día | FR-015 |
| `day_closed` | 409 | el día está marcado como cerrado | FR-015a |
| `day_closed` / `outside_opening_hours` | 409 | al cambiar horas, si alguna clase quedaría afuera | FR-016 |

Los tres conflictos llevan **datos, no solo un mensaje**, porque FR-022 obliga a decir qué corregir
y FR-016 a nombrar las clases que impiden el cambio:

```ts
export const classScheduleErrorBodySchema = z.object({
  error: z.enum([...]),
  message: z.string(),
  /** overlap_conflict: la clase con la que choca. */
  conflictingClass: scheduledClassSchema.optional(),
  /** hours change: las clases que quedarían fuera del rango nuevo. */
  conflictingClasses: z.array(scheduledClassSchema).optional(),
});
```

Sin esto, la pantalla solo podría decir "hay un conflicto" y la persona tendría que buscarlo a mano,
que es exactamente lo que FR-022 prohíbe.

---

## Lo que este contrato deliberadamente no expone

- **Ninguna forma de consultar la grilla en una fecha pasada** (FR-025a). No hay parámetro de fecha
  ni versión: el contrato describe la configuración vigente y nada más.
- **Ninguna referencia a cuentas.** Ni instructor asignado ni asistentes (FR-029). Cuando llegue la
  funcionalidad de asistencia, consumirá `GET /class-schedule` como insumo (FR-030) y guardará su
  propio dato.
- **Ningún cupo.** No hay campo de capacidad; aparecerá si la reserva de clases lo necesita.
- **Ninguna excepción por fecha.** Suspender la clase de un feriado no tiene representación
  (FR-007a).
