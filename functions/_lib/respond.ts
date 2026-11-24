import type { ApiErrorCode } from '../../shared/schemas';

// Common JSON response helpers (TECH_SPEC 7.1).

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...init.headers },
  });
}

const STATUS: Record<ApiErrorCode, number> = {
  rate_limited: 429,
  invalid_input: 400,
  ai_unavailable: 503,
  ai_invalid_output: 502,
  unauthorised: 401,
  server_error: 500,
};

export function error(code: ApiErrorCode, message: string, extra: Record<string, unknown> = {}) {
  return json({ error: { code, message, ...extra } }, { status: STATUS[code] });
}
