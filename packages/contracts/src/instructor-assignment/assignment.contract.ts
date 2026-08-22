import { z } from 'zod';

/**
 * POST /instructor-assignment/existing/:accountId — see
 * specs/003-instructor-role-assignment/contracts/instructor-assignment-endpoints.md
 */
export const promoteExistingUserResponseSchema = z.union([
  z.object({ status: z.literal('ok') }),
  z.object({
    status: z.literal('no_op'),
    reason: z.enum(['already_instructor', 'already_administrador']),
  }),
]);

export type PromoteExistingUserResponse = z.infer<typeof promoteExistingUserResponseSchema>;

export const PROMOTE_EXISTING_USER_ROUTE = {
  method: 'POST',
  path: '/instructor-assignment/existing/:accountId',
} as const;

/**
 * POST /instructor-assignment/invite
 */
export const inviteInstructorRequestSchema = z.object({
  email: z.string(),
});

export type InviteInstructorRequest = z.infer<typeof inviteInstructorRequestSchema>;

export const inviteInstructorResponseSchema = z.union([
  z.object({ status: z.literal('ok'), outcome: z.enum(['invited', 'promoted_existing']) }),
  z.object({
    status: z.literal('no_op'),
    reason: z.enum(['already_instructor', 'already_administrador', 'invitation_already_pending']),
  }),
]);

export type InviteInstructorResponse = z.infer<typeof inviteInstructorResponseSchema>;

export const INVITE_INSTRUCTOR_ROUTE = {
  method: 'POST',
  path: '/instructor-assignment/invite',
} as const;

/**
 * GET /instructor-assignment/invitations
 */
export const pendingInvitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdByAdminId: z.string(),
  createdAt: z.string(),
});

export type PendingInvitation = z.infer<typeof pendingInvitationSchema>;

export const listPendingInvitationsResponseSchema = z.object({
  items: z.array(pendingInvitationSchema),
});

export type ListPendingInvitationsResponse = z.infer<typeof listPendingInvitationsResponseSchema>;

export const LIST_PENDING_INVITATIONS_ROUTE = {
  method: 'GET',
  path: '/instructor-assignment/invitations',
} as const;

/**
 * POST /instructor-assignment/invitations/:invitationId/cancel
 */
export const cancelInvitationResponseSchema = z.object({ status: z.literal('ok') });

export type CancelInvitationResponse = z.infer<typeof cancelInvitationResponseSchema>;

export const CANCEL_INVITATION_ROUTE = {
  method: 'POST',
  path: '/instructor-assignment/invitations/:invitationId/cancel',
} as const;
