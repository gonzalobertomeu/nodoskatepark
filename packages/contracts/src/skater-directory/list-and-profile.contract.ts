import { z } from 'zod';

/**
 * GET /skater-directory — see specs/002-staff-skater-directory/contracts/skater-directory-endpoints.md
 */
export const skaterListEntrySchema = z.object({
  accountId: z.string(),
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  apodo: z.string().nullable(),
  fotoPath: z.string().nullable(),
  status: z.enum(['active', 'deactivated']),
});

export type SkaterListEntryResponse = z.infer<typeof skaterListEntrySchema>;

export const listSkatersResponseSchema = z.object({
  items: z.array(skaterListEntrySchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export type ListSkatersResponse = z.infer<typeof listSkatersResponseSchema>;

export const LIST_SKATERS_ROUTE = {
  method: 'GET',
  path: '/skater-directory',
} as const;

/**
 * GET /skater-directory/:accountId
 */
export const skaterFullProfileResponseSchema = z.object({
  accountId: z.string(),
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  fechaDeNacimiento: z.string().nullable(),
  email: z.string(),
  apodo: z.string().nullable(),
  afeccionesDeSalud: z.string().nullable(),
  fotoPath: z.string().nullable(),
  ultimoIngreso: z.string().nullable(),
  status: z.enum(['active', 'deactivated']),
});

export type SkaterFullProfileResponse = z.infer<typeof skaterFullProfileResponseSchema>;

export const GET_SKATER_PROFILE_ROUTE = {
  method: 'GET',
  path: '/skater-directory/:accountId',
} as const;

/**
 * PUT /skater-directory/:accountId — deliberately has no field for nombre/apellido/
 * fechaDeNacimiento/email/ultimoIngreso (FR-010 enforced structurally, not just in the UI).
 */
export const updateSkaterEditableFieldsRequestSchema = z.object({
  apodo: z.string().nullable(),
  afeccionesDeSalud: z.string().nullable(),
});

export type UpdateSkaterEditableFieldsRequest = z.infer<
  typeof updateSkaterEditableFieldsRequestSchema
>;

export const UPDATE_SKATER_ROUTE = {
  method: 'PUT',
  path: '/skater-directory/:accountId',
} as const;

/**
 * POST /skater-directory/:accountId/photo — multipart/form-data, single `photo` field.
 */
export const uploadSkaterPhotoResponseSchema = z.object({
  status: z.literal('ok'),
  fotoPath: z.string(),
});

export type UploadSkaterPhotoResponse = z.infer<typeof uploadSkaterPhotoResponseSchema>;

export const UPLOAD_SKATER_PHOTO_ROUTE = {
  method: 'POST',
  path: '/skater-directory/:accountId/photo',
} as const;

/**
 * GET /skater-directory/:accountId/photo — returns raw image bytes, not JSON; no response
 * schema here (contract only fixes the route).
 */
export const GET_SKATER_PHOTO_ROUTE = {
  method: 'GET',
  path: '/skater-directory/:accountId/photo',
} as const;
