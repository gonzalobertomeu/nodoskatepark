# Specification Quality Checklist: Navegación Principal por Barra Inferior según Rol

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-27
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

- Both [NEEDS CLARIFICATION] markers raised in the first validation pass were resolved in the
  2026-08-27 clarification session and encoded into the spec:
  - **Instructor destinations** → two destinations (listado de skaters + horarios de clases);
    the staff listing stays exclusive to administrador per 005-staff-directory (FR-010).
  - **Staff account and sign-out** → a persistent account element in each section's header, not a
    bottom-bar destination (FR-016, FR-017).
- One derived requirement came out of resolving the second marker: the skater's configuración
  destination cannot ship as an "in preparation" placeholder, since it is the only place a skater
  signs out. It ships with account data and sign-out as real content (FR-018), and remains open to
  a later specification. Without this, the first release would strand skaters with no way out of
  the application.
- Scope is bounded to the navigation shell. The two genuinely unbuilt destinations — reserva de
  clases and configuración de horarios de clases — get their place in the bar and an explicit
  in-preparation state (FR-025, FR-026); each still needs its own specification.
- Second clarification session (2026-08-27) resolved five further decision points and encoded them
  into the spec:
  - **Post-login landing** → the skater lands on "Reservar clases" in its in-preparation state; the
    bar order is not reshuffled to avoid it. FR-013 and SC-003 were rewritten accordingly, closing
    an internal contradiction between FR-013/SC-003 ("contenido útil, sin pantalla sin contenido")
    and FR-008/FR-025 (first skater destination is unbuilt).
  - **Addressability** → every destination and every nested surface has its own shareable,
    reloadable address (FR-020a). FR-019's scope was bounded to in-session destination switching:
    a full browser reload may discard scroll and filters (FR-020b, SC-002, SC-002a).
  - **Device back** → means "up one level" and matches the on-screen back affordance of FR-022;
    destination switches do not push history, so back never ping-pongs between destinations
    (FR-022a, FR-022b).
  - **Mid-session role change** → reflected on the next server interaction, no polling or push; if
    the current section is no longer permitted the person is moved to the first destination of the
    new role with an explanation (FR-014, FR-014a).
  - **Accessibility floor** → bar exposed as navigation with an announceable active destination,
    full keyboard reachability with visible focus (including the desktop rail of FR-030), and focus
    moved to the new section's heading after a reload-free transition (FR-027a–FR-027c, SC-006a).
    Scoped to the navigation this feature introduces, not a retro-audit of adopted surfaces.
- Ready for `/speckit-plan`.
