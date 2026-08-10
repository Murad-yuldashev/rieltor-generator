import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'rieltor:user-location';

async function freshChip() {
  vi.resetModules();
  return (await import('./location-chip')).LocationChip;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('LocationChip', () => {
  it('invites the visitor to choose when no location is known', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    const LocationChip = await freshChip();
    render(<LocationChip />);

    expect(screen.getByRole('button', { name: /Joyni tanlash/ })).toBeInTheDocument();
  });

  it('shows the stored district name', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat: 41.22, lng: 69.22, label: 'Sergeli tumani', source: 'manual' }),
    );
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    const LocationChip = await freshChip();
    render(<LocationChip />);

    expect(screen.getByRole('button', { name: /Sergeli tumani/ })).toBeInTheDocument();
  });

  it('opens the picker when tapped', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    const LocationChip = await freshChip();
    render(<LocationChip />);

    await userEvent.click(screen.getByRole('button', { name: /Joyni tanlash/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
