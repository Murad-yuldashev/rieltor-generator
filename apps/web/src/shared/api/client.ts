import type { ZodType } from 'zod';
import { AuthTokensSchema } from '@rieltor/shared';
import { clearTokens, readTokens, writeTokens } from './auth-storage';

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

/**
 * Every exception filter in this API (ZodExceptionFilter, Nest's own
 * `BadRequestException(text)` calls in ListingsService, ...) responds with a
 * JSON body carrying a `message` string — e.g. the wizard's submit endpoint
 * returns the Uzbek list of missing fields this way. Falls back to a generic
 * description when the body is missing, empty, or not JSON.
 */
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
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const stored = readTokens();
  if (stored) headers.authorization = `Bearer ${stored.accessToken}`;

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    // One refresh-and-retry per request: a 401 that survives a freshly-issued
    // access token is a real auth failure, not a merely stale one.
    if (response.status === 401 && !isRetry) {
      if (await refreshTokens()) return request(path, method, schema, body, true);
      clearTokens();
    }

    throw new ApiError(response.status, await readErrorMessage(response, method, path));
  }

  if (!schema) return undefined as T;

  // parse() throws on a mismatched response, so the UI never works with malformed data.
  return schema.parse(await response.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'GET', schema);
}

// `schema` is optional because several endpoints (submit, patch, delete-image) return
// no body at all — `request()` resolves to `undefined` when none is given, typed as
// `void` by the `T = void` default so a caller that skips the schema gets `Promise<void>`
// rather than `Promise<unknown>`. Callers that do pass a schema are unaffected: T is
// then inferred from it, same as before.
export function apiPost<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'POST', schema, body);
}

/** Draft update (`PATCH /api/my/listings/:id`) and friends — same no-body shape as apiPost. */
export function apiPatch<T = void>(path: string, schema?: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'PATCH', schema, body);
}

/** Image delete (`DELETE /api/my/listings/:id/images/:imageId`) — no body, no response. */
export function apiDelete<T = void>(path: string, schema?: ZodType<T>): Promise<T> {
  return request(path, 'DELETE', schema);
}
