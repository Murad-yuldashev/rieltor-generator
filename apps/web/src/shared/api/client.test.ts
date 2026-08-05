import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { apiGet, ApiError } from './client';

const schema = z.object({ views: z.number().int() });

afterEach(() => vi.unstubAllGlobals());

function fakeFetch(status: number, body: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

describe('apiGet', () => {
  it('parses the response with the schema', async () => {
    vi.stubGlobal('fetch', fakeFetch(200, { views: 7 }));
    expect(await apiGet('/api/view/bx-001', schema)).toEqual({ views: 7 });
  });

  it('throws ApiError carrying the status on 404', async () => {
    vi.stubGlobal('fetch', fakeFetch(404, { message: 'topilmadi' }));
    await expect(apiGet('/api/view/yoq', schema)).rejects.toMatchObject({ status: 404 });
  });

  it('throws when the response does not match the schema', async () => {
    vi.stubGlobal('fetch', fakeFetch(200, { views: 'kop' }));
    await expect(apiGet('/api/view/bx-001', schema)).rejects.toThrow();
  });

  it('the thrown value is an ApiError instance', async () => {
    vi.stubGlobal('fetch', fakeFetch(500, {}));
    await expect(apiGet('/api/view/bx-001', schema)).rejects.toBeInstanceOf(ApiError);
  });
});
