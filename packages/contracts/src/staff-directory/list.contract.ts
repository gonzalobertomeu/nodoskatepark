import { z } from 'zod';

/**
 * GET /staff-directory — see specs/005-staff-directory/contracts/staff-directory-endpoints.md
 */
export const staffListEntrySchema = z.object({
  accountId: z.string(),
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  email: z.string(),
  role: z.enum(['instructor', 'administrador']),
  status: z.enum(['active', 'deactivated']),
});

export type StaffListEntryResponse = z.infer<typeof staffListEntrySchema>;

export const listStaffResponseSchema = z.object({
  items: z.array(staffListEntrySchema),
});

export type ListStaffResponse = z.infer<typeof listStaffResponseSchema>;

export const LIST_STAFF_ROUTE = {
  method: 'GET',
  path: '/staff-directory',
} as const;
