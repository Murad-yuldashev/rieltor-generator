import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewCounter } from './view-counter';

function javob(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function chiqar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ViewCounter id="bx-001" />
    </QueryClientProvider>,
  );
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('ViewCounter', () => {
  it("sonni ko'z belgisi bilan chiqaradi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(200, { views: 42 })),
    );
    chiqar();
    expect(await screen.findByText(/42/)).toBeInTheDocument();
  });

  it('API xato bersa hech narsa render qilmaydi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(500, {})),
    );
    const { container } = chiqar();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
