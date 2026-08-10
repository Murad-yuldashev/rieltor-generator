import type { ZodType } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH';

async function request<T>(
  path: string,
  method: Method,
  schema: ZodType<T>,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} → ${response.status}`);
  }

  // parse() throws on a mismatched response, so the UI never works with malformed data.
  return schema.parse(await response.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'GET', schema);
}

export function apiPost<T>(path: string, schema: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'POST', schema, body);
}

export function apiPatch<T>(path: string, schema: ZodType<T>, body: unknown): Promise<T> {
  return request(path, 'PATCH', schema, body);
}
