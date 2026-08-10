import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { apiGet, apiPatch, apiPost, ApiError } from './client';

const schema = z.object({ views: z.number().int() });
const okSchema = z.object({ ok: z.boolean() });

afterEach(() => vi.unstubAllGlobals());

/** Typed on purpose: the assertions below read the RequestInit fetch was given. */
function spyFetch() {
  const mock = vi.fn(
    async (_path: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

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

describe('request bodies', () => {
  it('sends a JSON body and content-type on POST', async () => {
    const mock = spyFetch();
    await apiPost('/api/echo', okSchema, { phone: '+998901234567' });

    const init = mock.mock.calls[0]![1]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ phone: '+998901234567' }));
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
  });

  it('omits the body and content-type when there is nothing to send', async () => {
    const mock = spyFetch();
    await apiPost('/api/ping', okSchema);

    const init = mock.mock.calls[0]![1]!;
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>)['content-type']).toBeUndefined();
  });

  it('sends PATCH with a body', async () => {
    const mock = spyFetch();
    await apiPatch('/api/me', okSchema, { name: 'Ali' });

    expect(mock.mock.calls[0]![1]!.method).toBe('PATCH');
  });
});
