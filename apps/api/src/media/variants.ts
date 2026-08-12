import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_WIDTHS, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@rieltor/shared';

const QUALITY = 78;

export interface ImageVariant {
  /**
   * File name suffix — no listing id or position prefix, e.g. "360.webp", "1200.jpg".
   * Callers own the "<NN>-" prefix (prisma/images.ts for local disk, media.service.ts
   * for uploads) so this core stays position-agnostic, matching its single-Buffer signature.
   */
  name: string;
  body: Buffer;
}

export interface RenderedImageVariants {
  variants: ImageVariant[];
  /** 1200×630 cover-crop for og:image — always rendered; callers decide whether to keep it. */
  og: Buffer | null;
  /** Real dimensions of the largest (IMAGE_MAX_WIDTH) variant — feeds <img width/height> (CLS = 0). */
  width: number;
  height: number;
}

/**
 * Pure, in-memory image pipeline — sharp in, buffers out, no filesystem access.
 * This is the core the seed's disk-writing wrapper (apps/api/prisma/images.ts) and
 * the upload endpoint (media.service.ts) both call, so it works the same whether the
 * caller writes to local disk or uploads to R2 — and the same on a read-only Lambda
 * (design spec §6.2).
 */
export async function renderImageVariants(source: Buffer): Promise<RenderedImageVariants> {
  const variants: ImageVariant[] = [];
  let width = 0;
  let height = 0;

  for (const w of IMAGE_WIDTHS) {
    // withoutEnlargement: never upscale a small source, it would only look worse.
    const { data, info } = await sharp(source)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer({ resolveWithObject: true });

    variants.push({ name: `${w}.webp`, body: data });
    if (w === IMAGE_MAX_WIDTH) {
      width = info.width;
      height = info.height;
    }
  }

  // Single fallback for older browsers without WebP support.
  const fallback = await sharp(source)
    .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  variants.push({ name: `${IMAGE_MAX_WIDTH}.jpg`, body: fallback });

  // Telegram expects exactly 1200×630, so here resizing is mandatory, via cover crop.
  const og = await sharp(source)
    .resize({ width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return { variants, og, width, height };
}
