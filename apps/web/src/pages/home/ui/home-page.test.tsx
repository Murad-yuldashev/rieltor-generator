import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const listings = [
  {
    id: 'bx-001',
    title: '3 xonali kvartira',
    priceSom: '780000000',
    priceUsd: 65000,
    rooms: 3,
    areaM2: 84,
    floor: '3/5',
    district: 'Buxoro shahri',
    landmark: '12-maktab yaqinida',
    type: 'SECONDARY',
    deal: 'SALE',
    listedAt: '2026-07-22',
    lat: 41.31,
    lng: 69.24,
    image: { base: '/images/bx-001/01', ogUrl: null, width: 1200, height: 900, position: 1 },
    imageCount: 4,
  },
];

function renderPage() {
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
  it('renders the listing list as links', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(listings), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );

    renderPage();

    const link = await screen.findByRole('link', { name: /3 xonali kvartira/ });
    expect(link).toHaveAttribute('href', '/obj/bx-001');
    expect(screen.getByText("780 000 000 so'm")).toBeInTheDocument();
  });
});
