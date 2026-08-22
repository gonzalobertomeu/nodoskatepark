import {
  GET_SKATER_PHOTO_ROUTE,
  GET_SKATER_PROFILE_ROUTE,
  LIST_SKATERS_ROUTE,
  type ListSkatersResponse,
  listSkatersResponseSchema,
  type SkaterDirectoryErrorBody,
  type SkaterFullProfileResponse,
  skaterFullProfileResponseSchema,
  UPDATE_SKATER_ROUTE,
  UPLOAD_SKATER_PHOTO_ROUTE,
  type UpdateSkaterEditableFieldsRequest,
  type UploadSkaterPhotoResponse,
  uploadSkaterPhotoResponseSchema,
} from '@nodoskatepark/contracts';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class SkaterDirectoryApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: SkaterDirectoryErrorBody,
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
    throw new SkaterDirectoryApiError(response.status, raw as SkaterDirectoryErrorBody);
  }
  return parseResponse(raw);
}

function withAccountId(route: string, accountId: string): string {
  return route.replace(':accountId', accountId);
}

export const skaterDirectoryClient = {
  async listSkaters(
    params: { q?: string; page?: number; pageSize?: number } = {},
  ): Promise<ListSkatersResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    const response = await fetch(`${API_BASE_URL}${LIST_SKATERS_ROUTE.path}${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
    });
    return parseOrThrow(response, (raw) => listSkatersResponseSchema.parse(raw));
  },

  async getSkaterProfile(accountId: string): Promise<SkaterFullProfileResponse> {
    const response = await fetch(
      `${API_BASE_URL}${withAccountId(GET_SKATER_PROFILE_ROUTE.path, accountId)}`,
      { credentials: 'include' },
    );
    return parseOrThrow(response, (raw) => skaterFullProfileResponseSchema.parse(raw));
  },

  async updateSkaterEditableFields(
    accountId: string,
    input: UpdateSkaterEditableFieldsRequest,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${withAccountId(UPDATE_SKATER_ROUTE.path, accountId)}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    await parseOrThrow(response, () => undefined);
  },

  async uploadSkaterPhoto(accountId: string, file: File): Promise<UploadSkaterPhotoResponse> {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(
      `${API_BASE_URL}${withAccountId(UPLOAD_SKATER_PHOTO_ROUTE.path, accountId)}`,
      { method: 'POST', credentials: 'include', body: formData },
    );
    return parseOrThrow(response, (raw) => uploadSkaterPhotoResponseSchema.parse(raw));
  },

  async fetchSkaterPhotoBlob(accountId: string): Promise<Blob | null> {
    const response = await fetch(
      `${API_BASE_URL}${withAccountId(GET_SKATER_PHOTO_ROUTE.path, accountId)}`,
      { credentials: 'include' },
    );
    if (!response.ok) {
      return null;
    }
    return response.blob();
  },
};
