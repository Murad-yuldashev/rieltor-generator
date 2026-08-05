import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  IMAGE_MAX_WIDTH,
  IMAGE_WIDTHS,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  imageVariantSrc,
} from '@rieltor/shared';

export interface ProcessedImage {
  /** Base path without a variant; this is what is stored in the DB: "/images/bx-001/01" */
  base: string;
  ogUrl: string | null;
  /** Real dimensions of the largest variant — feeds <img width/height> (CLS = 0). */
  width: number;
  height: number;
}

export interface ProcessImageOptions {
  source: string | Buffer;
  /** Statik fayllar ildizi, odatda apps/api/public */
  outputRoot: string;
  listingId: string;
  /** One-based; the file name is zero-padded to two digits: 01, 02, ... */
  position: number;
  makeOg: boolean;
}

const QUALITY = 78;

export async function processImage(opts: ProcessImageOptions): Promise<ProcessedImage> {
  const { source, outputRoot, listingId, position, makeOg } = opts;

  const outputDir = join(outputRoot, 'images', listingId);
  await mkdir(outputDir, { recursive: true });

  const fileName = String(position).padStart(2, '0');
  const base = `/images/${listingId}/${fileName}`;

  let width = 0;
  let height = 0;

  for (const w of IMAGE_WIDTHS) {
    // withoutEnlargement: never upscale a small source, it would only look worse.
    const info = await sharp(source)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(outputDir, imageVariantSrc(fileName, w)));

    if (w === IMAGE_MAX_WIDTH) {
      width = info.width;
      height = info.height;
    }
  }

  // Single fallback for older browsers without WebP support.
  await sharp(source)
    .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(join(outputDir, `${fileName}-${IMAGE_MAX_WIDTH}.jpg`));

  let ogUrl: string | null = null;
  if (makeOg) {
    // Telegram expects exactly 1200×630, so here resizing is mandatory, via cover crop.
    await sharp(source)
      .resize({ width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(outputDir, 'og.jpg'));
    ogUrl = `/images/${listingId}/og.jpg`;
  }

  return { base, ogUrl, width, height };
}
