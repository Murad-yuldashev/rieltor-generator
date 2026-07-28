import { describe, expect, it } from 'vitest';
import { IMAGE_SIZES, IMAGE_WIDTHS, imageFallbackSrc, imageSrcSet } from './images';

describe('rasm yordamchilari', () => {
  it('uchta kenglik uchun srcset quradi', () => {
    expect(imageSrcSet('/images/bx-001/01')).toBe(
      '/images/bx-001/01-360.webp 360w, /images/bx-001/01-720.webp 720w, /images/bx-001/01-1200.webp 1200w',
    );
  });

  it('fallback sifatida eng katta jpg ni beradi', () => {
    expect(imageFallbackSrc('/images/bx-001/01')).toBe('/images/bx-001/01-1200.jpg');
  });

  it('kengliklar va sizes qiymati qotirilgan', () => {
    expect(IMAGE_WIDTHS).toEqual([360, 720, 1200]);
    expect(IMAGE_SIZES).toBe('(max-width: 480px) 100vw, 480px');
  });
});
