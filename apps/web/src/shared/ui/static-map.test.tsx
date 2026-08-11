import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StaticMap } from './static-map';

const POINT = { lat: 41.3111, lng: 69.2401 };

afterEach(() => vi.unstubAllEnvs());

describe('StaticMap', () => {
  it('renders a Yandex static image centred on the point', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    render(<StaticMap point={POINT} label="Uy joylashuvi" />);

    const image = screen.getByRole('img', { name: 'Uy joylashuvi' });
    const src = image.getAttribute('src') ?? '';
    expect(src).toContain('static-maps.yandex.ru');
    // Yandex takes longitude first in both ll and pt.
    expect(src).toContain('ll=69.2401%2C41.3111');
    expect(src).toContain('pt=69.2401%2C41.3111');
    expect(src).toContain('apikey=test-key');
  });

  it('loads lazily so a collapsed card costs nothing', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    render(<StaticMap point={POINT} label="Uy joylashuvi" />);
    expect(screen.getByRole('img', { name: 'Uy joylashuvi' })).toHaveAttribute('loading', 'lazy');
  });

  it('links out to the full Yandex map', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    render(<StaticMap point={POINT} label="Uy joylashuvi" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('yandex.uz/maps'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders nothing when the key is not configured', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    const { container } = render(<StaticMap point={POINT} label="Uy joylashuvi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once the image fails to load, matching a missing key', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    const { container } = render(<StaticMap point={POINT} label="Uy joylashuvi" />);

    fireEvent.error(screen.getByRole('img', { name: 'Uy joylashuvi' }));

    expect(container).toBeEmptyDOMElement();
  });
});
