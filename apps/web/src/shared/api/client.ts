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

type Method = 'GET' | 'POST';

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
    const error = new ApiError(response.status, `${method} ${path} → ${response.status}`);

    // One refresh-and-retry per request: a 401 that survives a freshly-issued
    // access token is a real auth failure, not a merely stale one.
    if (response.status === 401 && !isRetry) {
      if (await refreshTokens()) return request(path, method, schema, body, true);
      clearTokens();
    }

    throw error;
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
