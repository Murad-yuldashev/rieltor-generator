import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { apiGet, ApiXatosi } from './client';

const Sxema = z.object({ views: z.number().int() });

afterEach(() => vi.unstubAllGlobals());

function fetchSoxta(status: number, body: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

describe('apiGet', () => {
  it('javobni sxema bilan parse qiladi', async () => {
    vi.stubGlobal('fetch', fetchSoxta(200, { views: 7 }));
    expect(await apiGet('/api/view/bx-001', Sxema)).toEqual({ views: 7 });
  });

  it('404 da status bilan ApiXatosi tashlaydi', async () => {
    vi.stubGlobal('fetch', fetchSoxta(404, { message: 'topilmadi' }));
    await expect(apiGet('/api/view/yoq', Sxema)).rejects.toMatchObject({ status: 404 });
  });

  it('sxemaga mos kelmagan javobda xato tashlaydi', async () => {
    vi.stubGlobal('fetch', fetchSoxta(200, { views: 'kop' }));
    await expect(apiGet('/api/view/bx-001', Sxema)).rejects.toThrow();
  });

  it("ApiXatosi instansi to'g'ri tipda", async () => {
    vi.stubGlobal('fetch', fetchSoxta(500, {}));
    await expect(apiGet('/api/view/bx-001', Sxema)).rejects.toBeInstanceOf(ApiXatosi);
  });
});
