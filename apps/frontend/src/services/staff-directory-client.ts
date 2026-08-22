import {
  LIST_STAFF_ROUTE,
  type ListStaffResponse,
  listStaffResponseSchema,
  type StaffDirectoryErrorBody,
} from '@nodoskatepark/contracts';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class StaffDirectoryApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: StaffDirectoryErrorBody,
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
    throw new StaffDirectoryApiError(response.status, raw as StaffDirectoryErrorBody);
  }
  return parseResponse(raw);
}

export const staffDirectoryClient = {
  async listStaff(params: { q?: string } = {}): Promise<ListStaffResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    const qs = query.toString();
    const response = await fetch(`${API_BASE_URL}${LIST_STAFF_ROUTE.path}${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
    });
    return parseOrThrow(response, (raw) => listStaffResponseSchema.parse(raw));
  },
};
