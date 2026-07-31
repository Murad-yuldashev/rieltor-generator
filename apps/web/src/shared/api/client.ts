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

async function request<T>(path: string, method: 'GET' | 'POST', schema: ZodType<T>): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} → ${response.status}`);
  }

  // parse() mos kelmagan javobda tashlaydi — front noto'g'ri shakldagi ma'lumot bilan ishlamaydi.
  return schema.parse(await response.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'GET', schema);
}

export function apiPost<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'POST', schema);
}
