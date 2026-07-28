/**
 * Rasm fayl nomlash konvensiyasi — YAGONA manba.
 * Seed quvuri (apps/api/prisma/images.ts) shu nomlar bilan fayl yozadi,
 * front <img srcset> uchun, API esa <link rel=preload> uchun shu yerdan o'qiydi.
 * base = "/images/bx-001/01" → "/images/bx-001/01-720.webp"
 */
export const IMAGE_WIDTHS = [360, 720, 1200] as const;

/** Kontent desktopda 480px bilan cheklangan (spec §10). */
export const IMAGE_SIZES = '(max-width: 480px) 100vw, 480px';

export function imageSrcSet(base: string): string {
  return IMAGE_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
}

export function imageFallbackSrc(base: string): string {
  return `${base}-1200.jpg`;
}
