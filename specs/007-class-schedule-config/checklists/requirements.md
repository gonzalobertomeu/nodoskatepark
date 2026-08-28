# Specification Quality Checklist: Configuración del Calendario de Clases

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-28
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Los tres marcadores [NEEDS CLARIFICATION] de la primera pasada se resolvieron en la misma sesión
  y quedaron incorporados al spec, no solo en el lugar del marcador:
  - **Repetición semanal** → una clase se configura una vez y rige todas las semanas (FR-007). La
    consecuencia se hizo explícita: suspender una clase de un feriado queda fuera de alcance
    (FR-007a), y las historias, las entidades y SC-006 se reescribieron en términos de "grilla
    semanal" en vez de "calendario".
  - **Horario por día de la semana** → siete rangos con posibilidad de cerrar un día (FR-013).
    Agregó FR-015a (clase en día cerrado) y cambió FR-014 a FR-018, US2 completa y SC-002.
  - **Instructor de solo lectura** → FR-026 y FR-026a separan configurar de consultar; US4 pasó a
    ser una vista sin acciones de modificación, y SC-007 lo hace comprobable.
- El resto de las decisiones se tomaron como defaults razonables y están registradas en Assumptions:
  categoría de dos dimensiones, duración de una hora propuesta y no fija, una clase por vez (sin
  solapamiento), sin cupo y sin instructor asignado.
- Sesión de clarificación del 2026-08-28: cinco decisiones más, ya incorporadas al spec.
  - **Una clase por vez** → confirmado con el negocio. Era el riesgo de alcance que esta lista
    marcaba para vigilar; queda cerrado. FR-021 rechaza el solapamiento aunque las categorías
    difieran, y no hace falta ninguna noción de pista ni de espacio.
  - **Presentación en teléfono** → un día por vez con selector de día; semana completa en columnas
    a partir de tablet (FR-001a a FR-001c, SC-005, SC-005a). Sin esto, siete días por franjas
    horarias no entran a 320 px sin desplazamiento horizontal, que el Principio IX prohíbe.
  - **Zona horaria** → toda hora es local del skatepark, en sentido de reloj de pared (FR-018a).
    Un cambio de horario estacional no desplaza las clases.
  - **Sin historial** → la grilla describe solo la configuración vigente (FR-025a), y lo que
    ocurrió cada día queda a cargo de la funcionalidad de asistencia (FR-025b).
  - **Base de accesibilidad** → categoría anunciable por texto y no solo por color, teclado con
    foco visible en toda acción de la grilla, formularios con etiquetas, y errores anunciados con
    el foco llevado al campo a corregir (FR-004a, FR-022a, FR-033 a FR-035, SC-006a).
- Quedan como decisiones de planificación, no de especificación: los tiempos de carga de la sección
  —que heredan el techo que 006 ya fijó para la navegación— y el detalle de la resolución de
  conflicto cuando dos administradores editan a la vez, cuyo comportamiento observable ya está
  descrito en Edge Cases.
- Listo para `/speckit-plan`.
