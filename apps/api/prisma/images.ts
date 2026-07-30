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

export interface RasmNatija {
  /** Variantsiz asos yo'l, DB'ga shu yoziladi: "/images/bx-001/01" */
  base: string;
  ogUrl: string | null;
  /** Eng katta variantning haqiqiy o'lchami — front <img width/height> uchun (CLS = 0). */
  width: number;
  height: number;
}

export interface RasmniQaytaOpts {
  manba: string | Buffer;
  /** Statik fayllar ildizi, odatda apps/api/public */
  chiqishRoot: string;
  objectId: string;
  /** 1 dan boshlanadi; fayl nomi ikki xonali bo'ladi: 01, 02, ... */
  tartib: number;
  ogYasa: boolean;
}

const SIFAT = 78;

export async function rasmniQayta(opts: RasmniQaytaOpts): Promise<RasmNatija> {
  const { manba, chiqishRoot, objectId, tartib, ogYasa } = opts;

  const papka = join(chiqishRoot, 'images', objectId);
  await mkdir(papka, { recursive: true });

  const nom = String(tartib).padStart(2, '0');
  const base = `/images/${objectId}/${nom}`;

  let width = 0;
  let height = 0;

  for (const w of IMAGE_WIDTHS) {
    // withoutEnlargement — kichik manbani cho'zmaymiz, aks holda sifat buziladi.
    const info = await sharp(manba)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: SIFAT })
      .toFile(join(papka, imageVariantSrc(nom, w)));

    if (w === IMAGE_MAX_WIDTH) {
      width = info.width;
      height = info.height;
    }
  }

  // WebP'ni qo'llamaydigan eski brauzerlar uchun yagona fallback.
  await sharp(manba)
    .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: SIFAT, mozjpeg: true })
    .toFile(join(papka, `${nom}-${IMAGE_MAX_WIDTH}.jpg`));

  let ogUrl: string | null = null;
  if (ogYasa) {
    // Telegram qat'iy 1200×630 kutadi — bu yerda cho'zish shart, cover crop bilan.
    await sharp(manba)
      .resize({ width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(papka, 'og.jpg'));
    ogUrl = `/images/${objectId}/og.jpg`;
  }

  return { base, ogUrl, width, height };
}
