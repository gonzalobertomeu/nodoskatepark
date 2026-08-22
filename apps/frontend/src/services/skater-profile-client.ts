import {
  GET_SKATER_BASIC_INFO_ROUTE,
  type OkResponse,
  okResponseSchema,
  SAVE_SKATER_BASIC_INFO_ROUTE,
  type SaveSkaterBasicInfoRequest,
  type SkaterBasicInfoResponse,
  type SkaterProfileErrorBody,
  skaterBasicInfoResponseSchema,
} from '@nodoskatepark/contracts';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class SkaterProfileApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: SkaterProfileErrorBody,
  ) {
    super(body.message);
  }
}

async function getJson<TResponse>(
  path: string,
  parseResponse: (raw: unknown) => TResponse,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new SkaterProfileApiError(response.status, raw as SkaterProfileErrorBody);
  }

  return parseResponse(raw);
}

async function putJson<TResponse>(
  path: string,
  body: unknown,
  parseResponse: (raw: unknown) => TResponse,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new SkaterProfileApiError(response.status, raw as SkaterProfileErrorBody);
  }

  return parseResponse(raw);
}

export const skaterProfileClient = {
  getMyBasicInfo(): Promise<SkaterBasicInfoResponse> {
    return getJson(GET_SKATER_BASIC_INFO_ROUTE.path, (raw) =>
      skaterBasicInfoResponseSchema.parse(raw),
    );
  },

  saveMyBasicInfo(input: SaveSkaterBasicInfoRequest): Promise<OkResponse> {
    return putJson(SAVE_SKATER_BASIC_INFO_ROUTE.path, input, (raw) => okResponseSchema.parse(raw));
  },
};
