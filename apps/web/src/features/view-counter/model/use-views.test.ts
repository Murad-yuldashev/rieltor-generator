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
  it('POSTs on the first visit', async () => {
    const f = vi.fn(async () => response(200, { views: 8 }));
    vi.stubGlobal('fetch', f);

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(f).toHaveBeenCalledWith('/api/view/bx-001', expect.objectContaining({ method: 'POST' }));
  });

  it('sets the sessionStorage key after the POST', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(200, { views: 8 })),
    );

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(sessionStorage.getItem('viewed:bx-001')).toBe('1');
  });

  it('GETs when the key is already stored', async () => {
    sessionStorage.setItem('viewed:bx-001', '1');
    const f = vi.fn(async () => response(200, { views: 8 }));
    vi.stubGlobal('fetch', f);

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(f).toHaveBeenCalledWith('/api/view/bx-001', expect.objectContaining({ method: 'GET' }));
  });

  it('views is null on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(500, {})),
    );

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.views).toBeNull());
  });
});
