/**
 * Image file naming convention — the SINGLE source.
 * The seed pipeline (apps/api/prisma/images.ts) writes files under these names;
 * the frontend reads them for <img srcset> and the API for <link rel=preload>.
 * base = "/images/bx-001/01" → "/images/bx-001/01-720.webp"
 */
export const IMAGE_WIDTHS = [360, 720, 1200] as const;

/** Width of the largest variant — the JPG fallback and the CLS dimensions come from it. */
export const IMAGE_MAX_WIDTH: number = Math.max(...IMAGE_WIDTHS);

/** Content is capped at 480px on desktop (spec §10). */
export const IMAGE_SIZES = '(max-width: 480px) 100vw, 480px';

/** Telegram OG image size — the pipeline cover-crops to exactly this (spec §8). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** The `${base}-${w}.webp` template — both the writer (pipeline) and the reader use it. */
export function imageVariantSrc(base: string, w: number): string {
  return `${base}-${w}.webp`;
}

export function imageSrcSet(base: string): string {
  return IMAGE_WIDTHS.map((w) => `${imageVariantSrc(base, w)} ${w}w`).join(', ');
}

export function imageFallbackSrc(base: string): string {
  return `${base}-${IMAGE_MAX_WIDTH}.jpg`;
}
