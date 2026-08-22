import {
  CANCEL_INVITATION_ROUTE,
  type CancelInvitationResponse,
  cancelInvitationResponseSchema,
  INVITE_INSTRUCTOR_ROUTE,
  type InstructorAssignmentErrorBody,
  type InviteInstructorRequest,
  type InviteInstructorResponse,
  inviteInstructorResponseSchema,
  LIST_PENDING_INVITATIONS_ROUTE,
  type ListPendingInvitationsResponse,
  listPendingInvitationsResponseSchema,
  PROMOTE_EXISTING_USER_ROUTE,
  type PromoteExistingUserResponse,
  promoteExistingUserResponseSchema,
} from '@nodoskatepark/contracts';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class InstructorAssignmentApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: InstructorAssignmentErrorBody,
  ) {
    super(body.message);
  }
}

async function parseOrThrow<TResponse>(
  response: Response,
  parseResponse: (raw: unknown) => TResponse,
): Promise<TResponse> {
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new InstructorAssignmentApiError(response.status, raw as InstructorAssignmentErrorBody);
  }
  return parseResponse(raw);
}

export const instructorAssignmentClient = {
  async promoteExistingUser(accountId: string): Promise<PromoteExistingUserResponse> {
    const response = await fetch(
      `${API_BASE_URL}${PROMOTE_EXISTING_USER_ROUTE.path.replace(':accountId', accountId)}`,
      { method: 'POST', credentials: 'include' },
    );
    return parseOrThrow(response, (raw) => promoteExistingUserResponseSchema.parse(raw));
  },

  async inviteInstructor(input: InviteInstructorRequest): Promise<InviteInstructorResponse> {
    const response = await fetch(`${API_BASE_URL}${INVITE_INSTRUCTOR_ROUTE.path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return parseOrThrow(response, (raw) => inviteInstructorResponseSchema.parse(raw));
  },

  async listPendingInvitations(): Promise<ListPendingInvitationsResponse> {
    const response = await fetch(`${API_BASE_URL}${LIST_PENDING_INVITATIONS_ROUTE.path}`, {
      credentials: 'include',
    });
    return parseOrThrow(response, (raw) => listPendingInvitationsResponseSchema.parse(raw));
  },

  async cancelInvitation(invitationId: string): Promise<CancelInvitationResponse> {
    const response = await fetch(
      `${API_BASE_URL}${CANCEL_INVITATION_ROUTE.path.replace(':invitationId', invitationId)}`,
      { method: 'POST', credentials: 'include' },
    );
    return parseOrThrow(response, (raw) => cancelInvitationResponseSchema.parse(raw));
  },
};
