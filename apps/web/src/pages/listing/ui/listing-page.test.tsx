import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingPage } from './listing-page';

const listing = {
  id: 'bx-002',
  title: '2 xonali kvartira',
  priceSom: '480000000',
  priceUsd: 40000,
  rooms: 2,
  areaM2: 58,
  floor: '4/5',
  district: 'Buxoro shahri',
  address: "G'ijduvon ko'chasi 27",
  landmark: '12-maktab yaqinida',
  description: 'Ikki xonali kvartira.',
  type: 'SECONDARY',
  deal: 'SALE',
  views: 3,
  listedAt: '2026-07-22',
  images: [
    {
      base: '/images/bx-002/01',
      ogUrl: '/images/bx-002/og.jpg',
      width: 1200,
      height: 900,
      position: 1,
    },
  ],
  agent: {
    id: 'agent-1',
    name: 'Murod',
    agency: 'Buxoro Uy',
    photoUrl: '/images/agents/agent-1.jpg',
    phone: '+998901234567',
    phoneMasked: '+998 90 ••• •• 67',
    telegram: 'murod',
  },
};

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/obj/bx-002']}>
        <Routes>
          <Route path="/obj/:id" element={<ListingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('ListingPage', () => {
  it('renders the listing fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/view/') ? response(200, { views: 3 }) : response(200, listing),
      ),
    );

    renderPage();

    expect(await screen.findByText("480 000 000 so'm")).toBeInTheDocument();
    expect(screen.getByText('58 m²')).toBeInTheDocument();
    expect(screen.getByText('Ikki xonali kvartira.')).toBeInTheDocument();
    expect(screen.getByText('Murod')).toBeInTheDocument();
  });

  it('renders the CTA buttons with the seeded contact', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/view/') ? response(200, { views: 3 }) : response(200, listing),
      ),
    );

    renderPage();

    expect(await screen.findByRole('link', { name: /Qo'ng'iroq/ })).toHaveAttribute(
      'href',
      'tel:+998901234567',
    );
  });

  it('renders the not-found page on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(404, { message: 'topilmadi' })),
    );

    renderPage();

    expect(await screen.findByText(/topilmadi/i)).toBeInTheDocument();
  });
});
