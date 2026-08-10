import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationPicker } from './location-picker';

afterEach(() => vi.unstubAllEnvs());

describe('LocationPicker', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<LocationPicker open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('explains itself when the map key is missing', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    render(<LocationPicker open onClose={() => {}} />);

    expect(await screen.findByText(/Xarita sozlanmagan/)).toBeInTheDocument();
  });
});
