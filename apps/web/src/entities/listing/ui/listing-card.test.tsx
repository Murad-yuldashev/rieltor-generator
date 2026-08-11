import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ListingSummary } from '@rieltor/shared';
import { ListingCard } from './listing-card';

const listing: ListingSummary = {
  id: 'bx-001',
  title: '3 xonali kvartira',
  priceSom: '780000000',
  priceUsd: 65000,
  rooms: 3,
  areaM2: 84,
  floor: '3/5',
  district: 'Yunusobod tumani',
  landmark: '265-maktab yaqinida',
  type: 'SECONDARY',
  deal: 'SALE',
  listedAt: '2026-07-22',
  lat: 41.372,
  lng: 69.287,
  image: null,
  imageCount: 0,
};

function renderCard(props: Partial<Parameters<typeof ListingCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ListingCard listing={listing} {...props} />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllEnvs());

describe('ListingCard location', () => {
  it('shows the distance when it is known', () => {
    renderCard({ distanceLabel: '2.4 km' });
    expect(screen.getByText('2.4 km')).toBeInTheDocument();
  });

  it('offers the map button only for a listing with coordinates', () => {
    renderCard({ onToggleMap: () => {} });
    expect(screen.getByRole('button', { name: "Joylashuvni ko'rsatish" })).toBeInTheDocument();

    renderCard({ listing: { ...listing, lat: null, lng: null }, onToggleMap: () => {} });
    expect(screen.getAllByRole('button', { name: "Joylashuvni ko'rsatish" })).toHaveLength(1);
  });

  it('calls back when the map button is tapped', async () => {
    const onToggleMap = vi.fn();
    renderCard({ onToggleMap });

    await userEvent.click(screen.getByRole('button', { name: "Joylashuvni ko'rsatish" }));
    expect(onToggleMap).toHaveBeenCalledOnce();
  });

  it('renders no map control when maps are not enabled', () => {
    // The page decides whether to pass onToggleMap based on MAPS_ENABLED (shared/ui/static-map.tsx);
    // the card itself stays dumb and controlled by its props (FSD: it may not import that module).
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    renderCard();
    expect(screen.queryByRole('button', { name: "Joylashuvni ko'rsatish" })).toBeNull();
  });

  it('renders the map only while open', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');

    const closed = renderCard({ onToggleMap: () => {} });
    expect(closed.queryByRole('img', { name: /joylashuvi/i })).toBeNull();
    closed.unmount();

    renderCard({ onToggleMap: () => {}, mapOpen: true });
    expect(screen.getByRole('img', { name: /joylashuvi/i })).toBeInTheDocument();
  });
});
