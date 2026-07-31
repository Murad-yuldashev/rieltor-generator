import { render, screen } from '@testing-library/react';
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
  // jsdom'da IntersectionObserver yo'q — komponent unsiz ham qulamasligi kerak.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

describe('Gallery', () => {
  it('har rasm uchun bitta img chiqaradi', () => {
    render(<Gallery images={images} alt="Kvartira" />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('birinchi rasmni ustuvor yuklaydi, qolganlarini lazy', () => {
    render(<Gallery images={images} alt="Kvartira" />);
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('loading', 'eager');
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
    expect(imgs[1]).toHaveAttribute('loading', 'lazy');
  });

  it('srcset va sizes beradi', () => {
    render(<Gallery images={images} alt="Kvartira" />);
    const img = screen.getAllByRole('img')[0];
    expect(img).toHaveAttribute(
      'srcset',
      expect.stringContaining('/images/bx-001/01-720.webp 720w'),
    );
    expect(img).toHaveAttribute('sizes', '(max-width: 480px) 100vw, 480px');
  });

  it('CLS oldini olish uchun width/height beradi', () => {
    render(<Gallery images={images} alt="Kvartira" />);
    const img = screen.getAllByRole('img')[0];
    expect(img).toHaveAttribute('width', '1200');
    expect(img).toHaveAttribute('height', '900');
  });

  it('rasmlar soniga teng nuqta indikatori chiqaradi', () => {
    render(<Gallery images={images} alt="Kvartira" />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('birinchi nuqta boshida faol', () => {
    render(<Gallery images={images} alt="Kvartira" />);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('bitta rasmda indikator chiqmaydi', () => {
    render(<Gallery images={[images[0]!]} alt="Kvartira" />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  it("har rasmga o'z o'rnini bildiruvchi alt beradi", () => {
    render(<Gallery images={images} alt="Kvartira" />);
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('alt', 'Kvartira — 1/3');
    expect(imgs[2]).toHaveAttribute('alt', 'Kvartira — 3/3');
  });
});
