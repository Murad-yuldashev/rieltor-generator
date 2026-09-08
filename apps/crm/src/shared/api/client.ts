import type { ZodType } from 'zod';
import { AuthTokensSchema } from '@rieltor/shared';
import { clearTokens, readTokens, writeTokens } from './auth-storage';

/**
 * Fetch wrapper for the cabinet SPA. The API lives at /api/* (same origin
 * in prod, proxied to :3000 in dev). Every call attaches the stored bearer token
 * and retries once against a freshly refreshed token on a 401 — mirroring the web
 * app's client so the two never drift.
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

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * `POST /api/auth/refresh` only rotates the token pair (TokenService.issue on the
 * API side returns `{ accessToken, refreshToken }`, no user) — it validates a
 * narrower shape than the full AuthTokensSchema, which requires `user`.
 */
const RefreshedTokensSchema = AuthTokensSchema.pick({ accessToken: true, refreshToken: true });

/**
 * Exchanges the stored refresh token for a new pair. Uses a direct `fetch` — never
 * `request()` — so a failed refresh can never recurse into another refresh attempt.
 */
async function refreshTokens(): Promise<boolean> {
  const stored = readTokens();
  if (!stored) return false;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });

    if (!response.ok) return false;

    writeTokens(RefreshedTokensSchema.parse(await response.json()));
    return true;
  } catch {
    // Malformed response, network failure, etc. — treated the same as a rejected refresh.
    return false;
  }
}

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

/**
 * Attaches the bearer token and performs the fetch, retrying exactly once —
 * with a freshly refreshed token — on a 401. Shared by every call shape this
 * client makes (JSON via `request()`, multipart via `apiUpload()`) so the
 * retry logic can't drift between them.
 */
async function fetchWithAuth(path: string, init: RequestInit, isRetry = false): Promise<Response> {
  const headers = new Headers(init.headers);
  const stored = readTokens();
  if (stored) headers.set('authorization', `Bearer ${stored.accessToken}`);

  const response = await fetch(path, { ...init, headers });

  // One refresh-and-retry per request: a 401 that survives a freshly-issued
  // access token is a real auth failure, not a merely stale one.
  if (response.status === 401 && !isRetry) {
    if (await refreshTokens()) return fetchWithAuth(path, init, true);
    clearTokens();
  }

  return response;
}

async function request<T>(
  path: string,
  method: Method,
  schema: ZodType<T> | undefined,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetchWithAuth(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response, method, path));
  }

  if (!schema) return undefined as T;

  // Nest sends an EMPTY 200 body for a null/undefined controller return (e.g. a nullable GET
  // with no row). response.json() would throw SyntaxError on that empty body before the schema
  // runs, so read text and feed the schema `null` when empty — a `.nullable()` schema then
  // resolves to null (and a non-nullable one still errors, as it should). Non-empty bodies parse
  // exactly as response.json() did.
  const text = await response.text();
  // parse() throws on a mismatched response, so the UI never works with malformed data.
  return schema.parse(text === '' ? null : JSON.parse(text));
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'GET', schema);
}

export function apiPost<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'POST', schema, body);
}

export function apiPut<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'PUT', schema, body);
}

export function apiPatch<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'PATCH', schema, body);
}

export function apiDelete<T = void>(path: string, schema?: ZodType<T>): Promise<T> {
  return request(path, 'DELETE', schema);
}

/**
 * Multipart upload (`POST /api/crm/complexes/:id/images`) — `FormData` bodies go through
 * `fetchWithAuth` directly rather than `request()`: no `content-type` header is set here
 * (the browser fills in the multipart boundary itself), and there is nothing to
 * JSON.stringify. Still gets the same bearer-token attach and refresh-once-on-401 retry
 * as every other call.
 */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  schema?: ZodType<T>,
): Promise<T> {
  const response = await fetchWithAuth(path, {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response, 'POST', path));
  }

  const data: unknown = await response.json();
  return schema ? schema.parse(data) : (data as T);
}
