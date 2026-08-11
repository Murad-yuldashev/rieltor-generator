import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function renderPage(Page: typeof HomePage = HomePage) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});

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

  it('opens one card map at a time', async () => {
    localStorage.setItem(
      'rieltor:user-location',
      JSON.stringify({ lat: 41.31, lng: 69.24, label: 'Shayxontohur tumani', source: 'manual' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify([listings[0], { ...listings[0], id: 'bx-002' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
    // MAPS_ENABLED (shared/ui/static-map.tsx) reads the key once at module load,
    // so the stub has to be in place before a fresh copy of the page is imported —
    // stubbing after the top-level import (as the other tests do) would be too late.
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    vi.resetModules();
    const { HomePage: FreshHomePage } = await import('./home-page');

    renderPage(FreshHomePage);

    const buttons = await screen.findAllByRole('button', { name: "Joylashuvni ko'rsatish" });
    await userEvent.click(buttons[0]!);
    expect(screen.getAllByRole('img', { name: /joylashuvi/i })).toHaveLength(1);

    await userEvent.click(buttons[1]!);
    expect(screen.getAllByRole('img', { name: /joylashuvi/i })).toHaveLength(1);
  });
});
