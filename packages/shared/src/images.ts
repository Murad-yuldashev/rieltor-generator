/**
 * Rasm fayl nomlash konvensiyasi — YAGONA manba.
 * Seed quvuri (apps/api/prisma/images.ts) shu nomlar bilan fayl yozadi,
 * front <img srcset> uchun, API esa <link rel=preload> uchun shu yerdan o'qiydi.
 * base = "/images/bx-001/01" → "/images/bx-001/01-720.webp"
 */
export const IMAGE_WIDTHS = [360, 720, 1200] as const;

/** Eng katta variant kengligi — JPG fallback va CLS uchun haqiqiy o'lcham shundan olinadi. */
export const IMAGE_MAX_WIDTH: number = Math.max(...IMAGE_WIDTHS);

/** Kontent desktopda 480px bilan cheklangan (spec §10). */
export const IMAGE_SIZES = '(max-width: 480px) 100vw, 480px';

/** Telegram OG rasm o'lchami — pipeline shu o'lchamda cover-crop qiladi (spec §8). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** `${base}-${w}.webp` shabloni — yozuvchi (pipeline) va o'quvchi (bu fayl) shu yerdan oladi. */
export function imageVariantSrc(base: string, w: number): string {
  return `${base}-${w}.webp`;
}

export function imageSrcSet(base: string): string {
  return IMAGE_WIDTHS.map((w) => `${imageVariantSrc(base, w)} ${w}w`).join(', ');
}

export function imageFallbackSrc(base: string): string {
  return `${base}-${IMAGE_MAX_WIDTH}.jpg`;
}
