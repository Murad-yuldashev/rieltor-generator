import type { ZodType } from 'zod';

/**
 * Minimal fetch wrapper for the cabinet SPA. The agent API lives at /api/agent/*
 * (same origin in prod, proxied to :3000 in dev). Auth wiring (bearer token +
 * refresh-on-401) arrives in a later Phase 3.1 task; this shell only needs the
 * plain request shape so early pages can talk to the API.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function readErrorMessage(response: Response, method: Method, path: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message
    ) {
      return body.message;
    }
  } catch {
    // No JSON body — fall through to the generic message.
  }
  return `${method} ${path} → ${response.status}`;
}

async function request<T>(
  path: string,
  method: Method,
  schema: ZodType<T> | undefined,
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
    throw new ApiError(response.status, await readErrorMessage(response, method, path));
  }

  if (!schema) return undefined as T;

  // parse() throws on a mismatched response, so the UI never works with malformed data.
  return schema.parse(await response.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'GET', schema);
}

export function apiPost<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'POST', schema, body);
}

export function apiPatch<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'PATCH', schema, body);
}

export function apiDelete<T = void>(path: string, schema?: ZodType<T>): Promise<T> {
  return request(path, 'DELETE', schema);
}
