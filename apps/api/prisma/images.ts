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
  /** Variantsiz asos yo'l, DB'ga shu yoziladi: "/images/bx-001/01" */
  base: string;
  ogUrl: string | null;
  /** Eng katta variantning haqiqiy o'lchami — front <img width/height> uchun (CLS = 0). */
  width: number;
  height: number;
}

export interface ProcessImageOptions {
  source: string | Buffer;
  /** Statik fayllar ildizi, odatda apps/api/public */
  outputRoot: string;
  listingId: string;
  /** 1 dan boshlanadi; fayl nomi ikki xonali bo'ladi: 01, 02, ... */
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
    // withoutEnlargement — kichik manbani cho'zmaymiz, aks holda sifat buziladi.
    const info = await sharp(source)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(outputDir, imageVariantSrc(fileName, w)));

    if (w === IMAGE_MAX_WIDTH) {
      width = info.width;
      height = info.height;
    }
  }

  // WebP'ni qo'llamaydigan eski brauzerlar uchun yagona fallback.
  await sharp(source)
    .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(join(outputDir, `${fileName}-${IMAGE_MAX_WIDTH}.jpg`));

  let ogUrl: string | null = null;
  if (makeOg) {
    // Telegram qat'iy 1200×630 kutadi — bu yerda cho'zish shart, cover crop bilan.
    await sharp(source)
      .resize({ width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(outputDir, 'og.jpg'));
    ogUrl = `/images/${listingId}/og.jpg`;
  }

  return { base, ogUrl, width, height };
}
