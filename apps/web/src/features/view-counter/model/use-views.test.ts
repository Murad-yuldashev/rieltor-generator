import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViews } from './use-views';

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('useViews', () => {
  it('birinchi kirishda POST qiladi', async () => {
    const f = vi.fn(async () => response(200, { views: 8 }));
    vi.stubGlobal('fetch', f);

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(f).toHaveBeenCalledWith('/api/view/bx-001', expect.objectContaining({ method: 'POST' }));
  });

  it('POST dan keyin sessionStorage kalitini belgilaydi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(200, { views: 8 })),
    );

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(sessionStorage.getItem('viewed:bx-001')).toBe('1');
  });

  it("kalit mavjud bo'lsa GET qiladi", async () => {
    sessionStorage.setItem('viewed:bx-001', '1');
    const f = vi.fn(async () => response(200, { views: 8 }));
    vi.stubGlobal('fetch', f);

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(f).toHaveBeenCalledWith('/api/view/bx-001', expect.objectContaining({ method: 'GET' }));
  });

  it("xatoda views null bo'ladi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(500, {})),
    );

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBeNull());
  });
});
