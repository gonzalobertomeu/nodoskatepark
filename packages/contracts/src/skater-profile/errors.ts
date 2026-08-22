import { z } from 'zod';

export const SkaterProfileErrorCode = {
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  InvalidInput: 'invalid_input',
} as const;

export type SkaterProfileErrorCode =
  (typeof SkaterProfileErrorCode)[keyof typeof SkaterProfileErrorCode];

export const skaterProfileErrorBodySchema = z.object({
  error: z.enum([
    SkaterProfileErrorCode.Unauthenticated,
    SkaterProfileErrorCode.Forbidden,
    SkaterProfileErrorCode.InvalidInput,
  ]),
  message: z.string(),
});

export type SkaterProfileErrorBody = z.infer<typeof skaterProfileErrorBodySchema>;
