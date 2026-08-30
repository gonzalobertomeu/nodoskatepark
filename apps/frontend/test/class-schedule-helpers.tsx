import type { GetClassScheduleResponse } from '@nodoskatepark/contracts';

export const h = (hour: number, minute = 0) => hour * 60 + minute;

export function scheduleResponse(
  over: Partial<GetClassScheduleResponse> = {},
): GetClassScheduleResponse {
  return { classes: [], hours: [], ...over };
}

/** Stubs GET/POST/PUT/DELETE on /class-schedule so panel tests never touch the network. */
export function stubSchedule(
  initial: GetClassScheduleResponse,
  handlers: { onWrite?: (url: string, init?: RequestInit) => unknown } = {},
): { restore: () => void; calls: { url: string; method: string }[] } {
  const original = globalThis.fetch;
  const calls: { url: string; method: string }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    calls.push({ url, method });

    if (method === 'GET') {
      return new Response(JSON.stringify(initial), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const result = handlers.onWrite?.(url, init);
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify(result ?? { status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}
