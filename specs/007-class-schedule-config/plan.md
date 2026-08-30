# Implementation Plan: Configuración del Calendario de Clases

**Branch**: `007-class-schedule-config` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-class-schedule-config/spec.md`

## Summary

Llenar el destino "Horarios de clases" que 006 reservó y dejó en preparación. Un administrador
configura la grilla semanal —clases recurrentes con día, rango horario y categoría (franja etaria
más nivel)— y el horario de apertura del skatepark día por día, que acota dónde puede ubicarse cada
clase. Un instructor ve la misma grilla en solo lectura.

Es la primera funcionalidad del producto que guarda algo que no es una cuenta ni una sesión: dos
modelos nuevos, tres enums y una migración. El resto se apoya en lo que ya existe — el módulo se
arma con el patrón que 002, 003 y 005 ya siguen, y la pantalla ocupa el destino sin tocar la barra.

La decisión técnica que ordena todo lo demás está en [research.md](./research.md) §1: **una hora se
guarda como minutos desde medianoche**, nunca como fecha. FR-018a exige hora de reloj de pared que
no se desplace con el horario estacional ni se convierta a la zona de quien mira; con un entero eso
se cumple por construcción, y no queda ningún punto del sistema donde alguien pueda convertirla por
accidente.

## Technical Context

**Language/Version**: TypeScript 5.7 sobre Bun (Principio I)

**Primary Dependencies**: Backend NestJS con Prisma sobre PostgreSQL; frontend Astro 4.16
(`output: 'static'`) con React 18.3; Zod 3.25 y `@nodoskatepark/contracts` compartidos. **Ninguna
dependencia nueva.**

**Storage**: PostgreSQL. **Esquema nuevo**: `ScheduledClass` y `SkateparkHours`, más los enums
`DayOfWeek`, `ClassAgeGroup` y `ClassLevel`. Una migración de Prisma.

**Testing**: `bun test` en ambas aplicaciones, con `@testing-library/react` y `happy-dom` en el
frontend — la infraestructura que 006 dejó montada y en uso.

**Target Platform**: navegadores móviles primero, desde 320 px; riel lateral y semana en columnas
desde 1024 px.

**Performance Goals**: los que 006 ya fijó para el cambio de destino —contenido en ≤100 ms al volver
a un destino visitado, respuesta visible en ≤100 ms y datos reales en ≤1 s en la primera visita—.
Esta funcionalidad no agrega objetivos propios: una grilla semanal completa son decenas de filas.

**Constraints**: hora de reloj de pared, sin conversión de zona ni desplazamiento estacional
(FR-018a); sin dependencias nuevas; sin tocar la barra de navegación ni el mapa de destinos de 006;
solo colores de `tokens.css`; sin desplazamiento horizontal desde 320 px.

**Scale/Scope**: 2 modelos, 3 enums, 5 rutas, 2 guardias, 6 categorías posibles, 7 días. Una grilla
completa de un skatepark rara vez pasa de treinta clases.

## Constitution Check

*GATE: comprobado antes de Phase 0 y revalidado tras Phase 1. Resultado: **sin violaciones**.*

| Principio | Gate | Estado |
|---|---|---|
| I. Bun-First | Sin paso de compilación previo; `prisma generate` es codegen, explícitamente exceptuado. | PASS |
| II. Module-First Clean Architecture | Módulo nuevo `class-schedule/` con su `domain`/`application`/`infrastructure`. Las reglas —solapamiento, límites de horario, día cerrado— viven en `domain/` como funciones puras, sin tipos de NestJS ni de Prisma. Lo que necesita de `auth` pasa por su propio puerto `CurrentSessionResolver`, como ya hacen 002, 003, 004 y 005. | PASS |
| III. Contracts as Source of Truth | `packages/contracts/src/class-schedule/` se define primero; backend y frontend lo consumen. Ver [contracts/](./contracts/class-schedule-endpoints.md). | PASS |
| IV. Contenedores y Compose | Sin servicios nuevos. La migración se aplica sola: el comando del contenedor de backend ya corre `prisma migrate deploy`. | PASS |
| V. Nx + Biome | Sin dependencias ni herramientas nuevas. | PASS |
| VI. Neobrutalismo y paleta | La grilla y la hoja modal usan solo las variables de `tokens.css`. La categoría se distingue por texto y forma, **no solo por color** (FR-004a), lo que además es lo que el Principio VI permite sin colores nuevos. | PASS |
| VII. Lenguaje de roles | `administrador` configura, `instructor` consulta; "staff" como colectivo para el permiso de lectura. Los enums de categoría van en español —`menores`, `iniciantes`— siguiendo el precedente de `AccountRole`. | PASS |
| VIII. Resend | Sin correo saliente. Intacto. | PASS |
| IX. UX-First, Native-Feel Navigation | Ocupa un destino ya existente sin agregar ninguno. Camino de dos toques hasta cada acción, por debajo del techo de tres. Hoja modal como presentación nativa de un flujo secundario, explícitamente admitida. Una sola arquitectura de información: teléfono y escritorio muestran las mismas clases con la misma profundidad, cambiando solo cuántos días se ven a la vez. | PASS |

**Revalidación tras Phase 1**: sin desviaciones. El punto que más cerca estuvo de una fue la
validación del solapamiento: Postgres podría imponerla con una restricción de exclusión, pero Prisma
no la modela y habría que escribirla como SQL crudo. Se resuelve dentro de una transacción y el
riesgo residual queda registrado en research.md §5, no escondido.

## Project Structure

### Documentation (this feature)

```text
specs/007-class-schedule-config/
├── plan.md                              # Este archivo
├── spec.md
├── research.md                          # Phase 0 — 10 decisiones técnicas
├── data-model.md                        # Phase 1 — modelos, enums y reglas
├── quickstart.md                        # Phase 1 — 14 escenarios de validación
├── contracts/
│   └── class-schedule-endpoints.md      # Las 5 rutas, sus permisos y sus errores
├── checklists/
│   └── requirements.md
└── tasks.md                             # Phase 2 — lo crea /speckit-tasks
```

### Source Code (repository root)

```text
packages/contracts/src/
├── class-schedule/                          # NUEVO
│   ├── schedule.contract.ts                 # Tipos compartidos y las 5 rutas
│   ├── errors.ts                            # ClassScheduleErrorCode + cuerpo con datos
│   └── index.ts
└── index.ts                                 # MOD: exporta el módulo nuevo

apps/backend/prisma/
├── schema.prisma                            # MOD: 3 enums + 2 modelos
└── migrations/<ts>_add_class_schedule/      # NUEVO

apps/backend/src/modules/class-schedule/     # NUEVO — módulo completo
├── domain/
│   ├── entities/
│   │   ├── scheduled-class.entity.ts
│   │   └── skatepark-hours.entity.ts
│   ├── services/
│   │   └── schedule-rules.ts                # Solapamiento, límites, día cerrado — funciones puras
│   └── ports/
│       ├── class-schedule.repository.ts
│       └── current-session-resolver.ts      # Puerto propio hacia auth (Principio II)
├── application/use-cases/
│   ├── get-class-schedule.use-case.ts
│   ├── create-scheduled-class.use-case.ts
│   ├── update-scheduled-class.use-case.ts
│   ├── delete-scheduled-class.use-case.ts
│   └── set-skatepark-day-hours.use-case.ts
├── infrastructure/
│   ├── http/
│   │   ├── class-schedule.controller.ts
│   │   ├── class-schedule-staff.guard.ts        # Lectura: instructor o administrador
│   │   └── class-schedule-admin-only.guard.ts   # Escritura: solo administrador
│   └── persistence/
│       └── class-schedule.repository.ts
└── class-schedule.module.ts

apps/backend/src/modules/auth/infrastructure/
└── class-schedule-bridge/                   # NUEVO: adaptador del puerto, como los otros cuatro
    └── auth-class-schedule-session-resolver.adapter.ts

apps/frontend/src/
├── app/navigation-map.ts                    # MOD: `schedule` pasa de 'in-preparation' a 'built'
├── app/destination-registry.tsx             # MOD: monta ClassSchedulePanel en `schedule`
├── components/class-schedule/               # NUEVO
│   ├── ClassSchedulePanel.tsx               # El destino: selector de día + grilla + acciones
│   ├── DaySelector.tsx                      # Botones con aria-pressed (research.md §9)
│   ├── DayClassList.tsx                     # Las clases del día, ordenadas
│   ├── WeekColumns.tsx                      # Semana completa desde 1024 px
│   ├── ClassFormSheet.tsx                   # Hoja modal de crear y editar
│   └── SkateparkHoursSheet.tsx              # Hoja modal del horario del día
├── services/class-schedule-client.ts        # NUEVO
└── styles/class-schedule.css                # NUEVO — solo variables de tokens.css

apps/backend/test/                           # Reglas de dominio y permisos
apps/frontend/test/                          # Panel, selector, formularios y accesibilidad
```

**Structure Decision**: módulo nuevo en el backend, siguiendo exactamente el patrón que
`staff-directory` e `instructor-assignment` ya establecen — un bounded context por directorio, con
su corte Clean Architecture dentro y su propio puerto hacia `auth`. En el frontend, un directorio
propio bajo `components/class-schedule/`, montado desde el caparazón de 006 con **dos** cambios de
una línea cada uno: el `status` del destino en `navigation-map.ts` y el panel en
`destination-registry.tsx`. Hacen falta los dos: `renderDestination()` corta por `status` antes de
consultar el mapa de paneles, así que conectar el panel sin voltear el estado no muestra nada.

Las reglas de negocio se concentran en `domain/services/schedule-rules.ts` como funciones puras
—sin base de datos, sin framework—, que es lo que las hace probables de a decenas de casos en
milisegundos y lo que impide que la validación termine dispersa entre el controlador y la pantalla.

## Phase 0 — Outline & Research

Completado: [research.md](./research.md). Diez decisiones, cada una con sus alternativas
descartadas. Las de mayor consecuencia:

1. **Minutos desde medianoche** para toda hora. Descarta `DateTime` con fecha ficticia, que es la
   opción intuitiva y justo la que rompe FR-018a en cuanto servidor y navegador difieren de zona.
2. **Tres estados del horario de un día** —sin configurar, cerrado, abierto— con un booleano
   explícito. Colapsar los dos primeros haría imposible cumplir FR-018.
3. **Una sola lectura** que trae grilla y horarios juntos: la pantalla los muestra a la vez y las
   clases no se validan sin los horarios.
4. **Dos guardias**, una por nivel de permiso, en lugar de una parametrizada: hace legible en el
   propio controlador qué rol exige cada ruta.
5. **Hoja modal** para crear y editar, sin ruta propia: no agrega entradas al mapa de destinos de
   006 y mantiene viva la grilla debajo.
6. **Solapamiento validado dentro de una transacción**, con el riesgo residual de concurrencia
   registrado en lugar de resuelto con SQL crudo que Prisma no vería.

Sin ningún NEEDS CLARIFICATION pendiente.

## Phase 1 — Design & Contracts

Completado:

- **[data-model.md](./data-model.md)** — los dos modelos con sus reglas de validación, la tabla de
  los tres estados del horario, la frontera de formato (minutos adentro, `"HH:MM"` solo al pintar) y
  el estado que la sección mantiene en el navegador.
- **[contracts/class-schedule-endpoints.md](./contracts/class-schedule-endpoints.md)** — las cinco
  rutas con su permiso, los tipos compartidos, la unión discriminada que hace imposible enviar un
  día cerrado con horas, los ocho códigos de error y —lo que más importa para FR-022— los **datos**
  que acompañan a cada conflicto, para que la pantalla pueda nombrar la clase que choca.
- **[quickstart.md](./quickstart.md)** — catorce escenarios, incluido el que comprueba que cambiar
  la zona horaria del sistema no mueve ni una clase.

## Riesgos y puntos de atención

| Riesgo | Mitigación |
|---|---|
| Alguien introduce un `DateTime` para una hora y reaparece el problema de zona horaria. | La frontera está documentada en data-model.md §3 y el contrato solo transporta enteros; una prueba del escenario 11 de quickstart lo detecta. |
| Dos administradores creando clases solapadas en el mismo instante. | Comprobación y escritura en una transacción. El residuo queda anotado (research.md §5): un skatepark tiene uno o dos administradores y la ventana es de milisegundos. |
| La grilla de escritorio y la lista de teléfono divergen en qué muestran. | Ambas se alimentan de la misma lectura y del mismo componente de fila; SC-005a lo comprueba comparando anchos. |
| Primera migración de esquema del producto sobre datos existentes. | Solo agrega tablas y enums; no toca `accounts` ni ninguna tabla en uso, así que no hay backfill ni riesgo sobre datos vivos. |
| Conectar el panel sin voltear el `status` del destino: todo compila, las pruebas pasan y la sección sigue diciendo "Sección en preparación". | Las dos tareas están emparejadas y anotadas en tasks.md; el escenario 1 de quickstart lo detecta en el primer intento. |
| El destino queda a medias si se entrega solo la grilla sin los horarios. | Las historias están cortadas para que US1 sea entregable sola: sin horario configurado, las clases se crean sin restricción (FR-018), que es un estado válido y no un error. |

## Complexity Tracking

Sin violaciones de la constitución que justificar. Esta sección queda intencionalmente vacía.
