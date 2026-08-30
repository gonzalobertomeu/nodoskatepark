# UI contract — Mapa de navegación

**Feature**: `006-role-based-bottom-nav`

La barra no consume ningún servicio de navegación: el mapa vive en la aplicación y se resuelve a
partir del rol de la sesión (FR-007a). Este documento es el contrato **entre el caparazón y el
resto del frontend** — lo que cualquier funcionalidad futura debe respetar para alojar una
superficie dentro de la aplicación autenticada.

## Rutas direccionables

Las ocho rutas se prerenderizan estáticamente y todas montan el mismo `AppShell`.

| Ruta | Tipo | Destino activo | Roles con acceso |
|---|---|---|---|
| `/` | aterrizaje | — | todos (reemplaza por el destino 1 del rol) |
| `/bookings` | destino (en preparación) | `bookings` | `skater` |
| `/profile` | destino | `profile` | `skater` |
| `/settings` | destino | `settings` | `skater` |
| `/skaters` | destino | `skaters` | `instructor`, `administrador` |
| `/skaters/profile?accountId=…` | superficie anidada | `skaters` | `instructor`, `administrador` |
| `/staff` | destino | `staff` | `administrador` |
| `/staff/instructors` | superficie anidada | `staff` | `administrador` |
| `/schedule` | destino (en preparación) | `schedule` | `instructor`, `administrador` |

Rutas **fuera** del caparazón, donde la barra no se dibuja (FR-005): `/login`, `/register`,
`/forgot-password`, `/reset-password`, `/verify-email`, `/onboarding`.

## Semántica de navegación

| Acción | Método de historial | Efecto de "atrás" del dispositivo |
|---|---|---|
| Tocar un destino de la barra | `replaceState` | No vuelve al destino anterior (FR-022b) |
| Abrir una superficie anidada | `pushState` | Vuelve a la raíz de su destino (FR-022a) |
| Tocar el destino ya activo | ninguno | Sin efecto; no descarta estado (FR-006) |
| `/` tras el ingreso | `replaceState` al destino 1 | Sale del entorno autenticado |

Consecuencia buscada: desde la raíz de un destino, "atrás" sale del entorno autenticado, porque la
entrada de historial que precede es la que había antes de entrar (FR-022a).

## Estados que todo destino debe saber presentar

| Estado | Cuándo | Presentación | Requisito |
|---|---|---|---|
| `in-preparation` | `status: 'in-preparation'` en el mapa | Mensaje explícito de sección en preparación; barra viva; salida con un toque | FR-025, FR-026 |
| `error` | Fallo de red o del servidor al traer datos | Error dentro del destino, con reintentar; barra viva | FR-024a |
| `loading` | Primera visita, datos en vuelo | Encabezado real + esqueleto, visible en ≤100 ms | FR-020c |
| `ready` | Datos presentes | Contenido real | FR-020c (≤1 s en primera visita) |

`in-preparation` y `error` MUST ser visualmente distinguibles entre sí (FR-024b).

## Cómo aloja una funcionalidad futura su superficie

Toda especificación con interfaz debe declarar, por Principio IX, bajo qué destino vive su
superficie y el camino de toques que la alcanza. Con este mapa eso significa una de dos cosas:

1. **Ocupa un destino ya reservado** — `bookings` o `schedule` pasan de `in-preparation` a `built`
   y montan su componente. No hay que tocar la barra ni ninguna ruta.
2. **Se anida bajo un destino existente** — agrega una entrada a `NestedSurface` con su `path`,
   su destino padre y su componente, respetando el techo de tres toques (FR-021).

Agregar un **destino nuevo** de primer nivel exige revisar el límite de 2 a 5 destinos por rol del
Principio IX y modificar esta especificación; no es una decisión que una funcionalidad posterior
pueda tomar de paso.
