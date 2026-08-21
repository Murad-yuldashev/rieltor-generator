import { describe, expect, it } from 'vitest';
import { IMAGE_SIZES, IMAGE_WIDTHS, imageFallbackSrc, imageSrcSet } from './images';

describe('image helpers', () => {
  it('builds a srcset for the three widths', () => {
    expect(imageSrcSet('/images/bx-001/01')).toBe(
      '/images/bx-001/01-360.webp 360w, /images/bx-001/01-720.webp 720w, /images/bx-001/01-1200.webp 1200w',
    );
  });

  it('uses the largest jpg as the fallback', () => {
    expect(imageFallbackSrc('/images/bx-001/01')).toBe('/images/bx-001/01-1200.jpg');
  });

  it('the widths and the sizes value are pinned', () => {
    expect(IMAGE_WIDTHS).toEqual([360, 720, 1200]);
    expect(IMAGE_SIZES).toBe('(max-width: 480px) 100vw, (max-width: 1439px) 480px, 360px');
  });
});
