import { z } from 'zod';

/**
 * GET /skater-profile/me — see specs/004-skater-onboarding/contracts/skater-profile-endpoints.md
 */
export const skaterBasicInfoResponseSchema = z.object({
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  fechaDeNacimiento: z.string().nullable(),
  complete: z.boolean(),
});

export type SkaterBasicInfoResponse = z.infer<typeof skaterBasicInfoResponseSchema>;

export const GET_SKATER_BASIC_INFO_ROUTE = {
  method: 'GET',
  path: '/skater-profile/me',
} as const;

/**
 * PUT /skater-profile/me — all three fields required together on every call (FR-009); serves
 * both the initial onboarding submission and any later self-edit. Responds with the shared
 * `{ status: "ok" }` shape already exported from `../auth/errors` (`OkResponse`) — not
 * redeclared here to avoid a duplicate-export collision at the package root.
 *
 * Deliberately just `z.string()` for nombre/apellido, not `.trim().min(1)`: business validation
 * (non-empty, valid/realistic birth date — FR-005) is owned by `SaveMyBasicInfoUseCase`, which
 * throws a proper `400 invalid_input` contract error. A schema-level `.min(1)` would instead
 * throw an uncaught ZodError at the controller's `.parse()` call, before the use case ever runs
 * — surfacing as an opaque `500`, not the documented `400`.
 */
export const saveSkaterBasicInfoRequestSchema = z.object({
  nombre: z.string(),
  apellido: z.string(),
  fechaDeNacimiento: z.string(),
});

export type SaveSkaterBasicInfoRequest = z.infer<typeof saveSkaterBasicInfoRequestSchema>;

export const SAVE_SKATER_BASIC_INFO_ROUTE = {
  method: 'PUT',
  path: '/skater-profile/me',
} as const;
