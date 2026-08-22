import { z } from 'zod';

export const StaffDirectoryErrorCode = {
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
} as const;

export type StaffDirectoryErrorCode =
  (typeof StaffDirectoryErrorCode)[keyof typeof StaffDirectoryErrorCode];

export const staffDirectoryErrorBodySchema = z.object({
  error: z.enum([StaffDirectoryErrorCode.Unauthenticated, StaffDirectoryErrorCode.Forbidden]),
  message: z.string(),
});

export type StaffDirectoryErrorBody = z.infer<typeof staffDirectoryErrorBodySchema>;
