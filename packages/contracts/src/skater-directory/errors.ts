import { z } from 'zod';

export const SkaterDirectoryErrorCode = {
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  InvalidInput: 'invalid_input',
} as const;

export type SkaterDirectoryErrorCode =
  (typeof SkaterDirectoryErrorCode)[keyof typeof SkaterDirectoryErrorCode];

export const skaterDirectoryErrorBodySchema = z.object({
  error: z.enum([
    SkaterDirectoryErrorCode.Unauthenticated,
    SkaterDirectoryErrorCode.Forbidden,
    SkaterDirectoryErrorCode.NotFound,
    SkaterDirectoryErrorCode.InvalidInput,
  ]),
  message: z.string(),
});

export type SkaterDirectoryErrorBody = z.infer<typeof skaterDirectoryErrorBodySchema>;
