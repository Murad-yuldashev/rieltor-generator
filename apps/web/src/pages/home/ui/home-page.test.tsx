import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const royxat = [
  {
    id: 'bx-001',
    sarlavha: '3 xonali kvartira',
    narxSom: '780000000',
    narxUsd: 65000,
    xona: 3,
    maydonM2: 84,
    tuman: 'Buxoro shahri',
    rasm: { base: '/images/bx-001/01', ogUrl: null, width: 1200, height: 900, tartib: 1 },
  },
];

function chiqar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('HomePage', () => {
  it("obyektlar ro'yxatini havola sifatida ko'rsatadi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(royxat), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );

    chiqar();

    const havola = await screen.findByRole('link', { name: /3 xonali kvartira/ });
    expect(havola).toHaveAttribute('href', '/obj/bx-001');
    expect(screen.getByText("780 000 000 so'm")).toBeInTheDocument();
  });
});
