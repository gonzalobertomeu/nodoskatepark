import { z } from 'zod';

export const InstructorAssignmentErrorCode = {
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  InvalidInput: 'invalid_input',
} as const;

export type InstructorAssignmentErrorCode =
  (typeof InstructorAssignmentErrorCode)[keyof typeof InstructorAssignmentErrorCode];

export const instructorAssignmentErrorBodySchema = z.object({
  error: z.enum([
    InstructorAssignmentErrorCode.Unauthenticated,
    InstructorAssignmentErrorCode.Forbidden,
    InstructorAssignmentErrorCode.NotFound,
    InstructorAssignmentErrorCode.InvalidInput,
  ]),
  message: z.string(),
});

export type InstructorAssignmentErrorBody = z.infer<typeof instructorAssignmentErrorBodySchema>;
