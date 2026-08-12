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

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(
  path: string,
  method: Method,
  schema: ZodType<T> | undefined,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  // FormData bodies (image upload) must NOT get a manual content-type — the browser
  // sets multipart/form-data with the boundary itself, which we cannot reproduce.
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers['content-type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} → ${response.status}`);
  }

  if (!schema) return undefined as T;

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

/** Multipart POST (image upload) — body is a FormData, never JSON-stringified. */
export function apiUpload<T>(path: string, schema: ZodType<T>, formData: FormData): Promise<T> {
  return request(path, 'POST', schema, formData);
}

/** schema is optional: pass none for a call whose response body carries nothing useful. */
export function apiDelete<T = void>(path: string, schema?: ZodType<T>): Promise<T> {
  return request(path, 'DELETE', schema);
}
