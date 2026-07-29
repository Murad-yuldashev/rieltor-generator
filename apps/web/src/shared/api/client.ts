import type { ZodType } from 'zod';

export class ApiXatosi extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiXatosi';
  }
}

async function sorov<T>(path: string, method: 'GET' | 'POST', schema: ZodType<T>): Promise<T> {
  const javob = await fetch(path, {
    method,
    headers: { accept: 'application/json' },
  });

  if (!javob.ok) {
    throw new ApiXatosi(javob.status, `${method} ${path} → ${javob.status}`);
  }

  // parse() mos kelmagan javobda tashlaydi — front noto'g'ri shakldagi ma'lumot bilan ishlamaydi.
  return schema.parse(await javob.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return sorov(path, 'GET', schema);
}

export function apiPost<T>(path: string, schema: ZodType<T>): Promise<T> {
  return sorov(path, 'POST', schema);
}
