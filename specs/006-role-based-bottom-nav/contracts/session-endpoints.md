# Contract delta — `GET /auth/session`

**Feature**: `006-role-based-bottom-nav` | **Owner contract**:
`packages/contracts/src/auth/session.contract.ts` (definido por `001-user-login-sso`)

Esta funcionalidad **no crea ningún endpoint**. Introduce un único cambio: agregar `email` a la
rama autenticada de la respuesta de sesión, para que el destino "Configuración" del skater pueda
presentar los datos de la cuenta (FR-018, FR-018a).

## Antes

```ts
export const sessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(true), role: accountRoleSchema }),
  z.object({ authenticated: z.literal(false) }),
]);
```

## Después

```ts
export const sessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({
    authenticated: z.literal(true),
    role: accountRoleSchema,
    email: z.string(),
  }),
  z.object({ authenticated: z.literal(false) }),
]);
```

`z.string()` a secas y no `.email()`: el valor lo produce el servidor a partir de una cuenta ya
validada, y una validación de formato en el esquema convertiría un dato correcto pero inesperado
en un `ZodError` sin manejar del lado del cliente. Mismo criterio ya aplicado en
`skater-profile/basic-info.contract.ts`.

## Compatibilidad

Es un cambio **aditivo y rompedor a la vez**, según el lado:

- **Backend**: debe empezar a enviar `email` antes o junto con el despliegue del frontend nuevo;
  un cliente actualizado que reciba la respuesta vieja falla al parsear.
- **Frontend existente**: `auth-client.session()` y `SessionRedirectGuard` solo leen
  `authenticated`; siguen funcionando sin cambios.

Por el Development Workflow de la constitución, contrato, backend y frontend deben quedar
consistentes en el mismo PR (o en PRs explícitamente secuenciados que no dejen `main` en un estado
donde backend y contrato discrepen).

## Cadena de propagación en el servidor

El dato ya está disponible donde se resuelve la sesión; no hay consulta nueva a la base de datos.

| Archivo | Cambio |
|---|---|
| `apps/backend/src/modules/auth/application/use-cases/validate-session.use-case.ts` | `ValidatedSession` gana `email: string`; el `return` pasa `account.email` (la entidad `Account` ya se carga para comprobar `status`). |
| `apps/backend/src/modules/auth/infrastructure/http/session.guard.ts` | `AuthenticatedRequest['session']` gana `email`; `resolveSession` lo adjunta. |
| `apps/backend/src/modules/auth/infrastructure/http/auth.controller.ts` | `getSession` devuelve `{ authenticated: true, role, email }`. |

Ninguna capa `domain/` cambia: `Account.email` ya existe. El cambio queda contenido en
`application/` e `infrastructure/` del módulo `auth` (Principio II).

## Endpoints reutilizados sin modificar

| Endpoint | Uso en esta funcionalidad |
|---|---|
| `POST /auth/logout` | Cierre de sesión desde "Configuración" (skater) y desde el elemento de cuenta del encabezado (staff) — FR-015, FR-016. |
| `POST /auth/password-reset/request` | Acción "Cambiar contraseña" de "Configuración", con el email de la propia cuenta (research.md §5). |
| `GET /skater-profile/me` | Comprobación de onboarding completo antes de dibujar la barra (FR-005). |
| `PUT /skater-profile/me` | Edición desde el destino "Mi perfil" (FR-018a). |
| `GET /skater-directory`, `GET /skater-directory/:id` | Destino "Skaters" y su superficie anidada. |
| `GET /staff-directory` | Destino "Staff". |
| `POST /instructor-assignment/*` | Superficie anidada `/staff/instructors`. |

**Ninguno de estos cambia.** Su control de acceso en el servidor permanece intacto y es lo que
sostiene FR-012.
