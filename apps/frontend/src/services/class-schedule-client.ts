import {
  type ClassScheduleErrorBody,
  CREATE_SCHEDULED_CLASS_ROUTE,
  type DayOfWeek,
  DELETE_SCHEDULED_CLASS_ROUTE,
  GET_CLASS_SCHEDULE_ROUTE,
  type GetClassScheduleResponse,
  getClassScheduleResponseSchema,
  type ScheduledClassInput,
  type ScheduledClassResponse,
  SET_SKATEPARK_DAY_HOURS_ROUTE,
  type SetSkateparkDayHoursRequest,
  type SkateparkDayHoursResponse,
  scheduledClassSchema,
  skateparkDayHoursSchema,
  UPDATE_SCHEDULED_CLASS_ROUTE,
} from '@nodoskatepark/contracts';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class ClassScheduleApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ClassScheduleErrorBody,
  ) {
    super(body.message);
  }
}

async function request<TResponse>(
  path: string,
  init: RequestInit,
  parseResponse: (raw: unknown) => TResponse,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...init });
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ClassScheduleApiError(response.status, raw as ClassScheduleErrorBody);
  }
  return parseResponse(raw);
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export const classScheduleClient = {
  getSchedule(): Promise<GetClassScheduleResponse> {
    return request(GET_CLASS_SCHEDULE_ROUTE.path, { method: 'GET' }, (raw) =>
      getClassScheduleResponseSchema.parse(raw),
    );
  },

  createClass(input: ScheduledClassInput): Promise<ScheduledClassResponse> {
    return request(
      CREATE_SCHEDULED_CLASS_ROUTE.path,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(input) },
      (raw) => scheduledClassSchema.parse(raw),
    );
  },

  updateClass(id: string, input: ScheduledClassInput): Promise<ScheduledClassResponse> {
    return request(
      UPDATE_SCHEDULED_CLASS_ROUTE.path.replace(':id', id),
      { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(input) },
      (raw) => scheduledClassSchema.parse(raw),
    );
  },

  deleteClass(id: string): Promise<void> {
    return request(
      DELETE_SCHEDULED_CLASS_ROUTE.path.replace(':id', id),
      { method: 'DELETE' },
      () => undefined,
    );
  },

  setDayHours(
    dayOfWeek: DayOfWeek,
    input: SetSkateparkDayHoursRequest,
  ): Promise<SkateparkDayHoursResponse> {
    return request(
      SET_SKATEPARK_DAY_HOURS_ROUTE.path.replace(':dayOfWeek', dayOfWeek),
      { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(input) },
      (raw) => skateparkDayHoursSchema.parse(raw),
    );
  },
};
