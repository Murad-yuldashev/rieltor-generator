import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Gallery } from './gallery';

const images = [
  {
    base: '/images/bx-001/01',
    ogUrl: '/images/bx-001/og.jpg',
    width: 1200,
    height: 900,
    position: 1,
  },
  { base: '/images/bx-001/02', ogUrl: null, width: 1200, height: 900, position: 2 },
  { base: '/images/bx-001/03', ogUrl: null, width: 1200, height: 900, position: 3 },
];

beforeEach(() => {
  // jsdom has no IntersectionObserver — the component must survive without it.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

/** The gallery has a "back" button, which needs a router context to work. */
function renderGallery(list = images) {
  return render(
    <MemoryRouter>
      <Gallery images={list} alt="Kvartira" type="NEW_BUILD" id="bx-001" />
    </MemoryRouter>,
  );
}

describe('Gallery', () => {
  it('renders one img per image', () => {
    renderGallery();
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('loads the first image eagerly and the rest lazily', () => {
    renderGallery();
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('loading', 'eager');
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
    expect(imgs[1]).toHaveAttribute('loading', 'lazy');
  });

  it('sets srcset and sizes', () => {
    renderGallery();
    const img = screen.getAllByRole('img')[0];
    expect(img).toHaveAttribute(
      'srcset',
      expect.stringContaining('/images/bx-001/01-720.webp 720w'),
    );
    expect(img).toHaveAttribute('sizes', '(max-width: 480px) 100vw, 480px');
  });

  it('sets width/height to prevent CLS', () => {
    renderGallery();
    const img = screen.getAllByRole('img')[0];
    expect(img).toHaveAttribute('width', '1200');
    expect(img).toHaveAttribute('height', '900');
  });

  it('renders one dot per image', () => {
    renderGallery();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('the first dot starts out active', () => {
    renderGallery();
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('renders no dots for a single image', () => {
    renderGallery([images[0]!]);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  it('gives every image an alt stating its position', () => {
    renderGallery();
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('alt', 'Kvartira — 1/3');
    expect(imgs[2]).toHaveAttribute('alt', 'Kvartira — 3/3');
  });
});
