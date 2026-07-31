import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_WIDTHS, imageFallbackSrc, imageSrcSet } from '@rieltor/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { processImage } from './images';

let outputRoot: string;

/** Testda binar fayl saqlamaslik uchun manba rasm shu yerda generatsiya qilinadi. */
async function sourceImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 90, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}

beforeEach(async () => {
  outputRoot = await mkdtemp(join(tmpdir(), 'rieltor-img-'));
});

afterEach(async () => {
  await rm(outputRoot, { recursive: true, force: true });
});

describe('processImage', () => {
  it('uchta webp va bitta jpg fallback yozadi', async () => {
    const result = await processImage({
      source: await sourceImage(2000, 1500),
      outputRoot,
      listingId: 'bx-001',
      position: 1,
      makeOg: false,
    });

    expect(result.base).toBe('/images/bx-001/01');

    for (const w of [360, 720, 1200]) {
      const meta = await sharp(join(outputRoot, `images/bx-001/01-${w}.webp`)).metadata();
      expect(meta.width).toBe(w);
      expect(meta.format).toBe('webp');
    }

    const fallback = await sharp(join(outputRoot, 'images/bx-001/01-1200.jpg')).metadata();
    expect(fallback.format).toBe('jpeg');
    expect(fallback.width).toBe(1200);
  });

  it("1200 variantining haqiqiy o'lchamini qaytaradi", async () => {
    const result = await processImage({
      source: await sourceImage(2000, 1500),
      outputRoot,
      listingId: 'bx-001',
      position: 1,
      makeOg: false,
    });

    expect(result.width).toBe(1200);
    expect(result.height).toBe(900);
  });

  it('kichik manbani kattalashtirmaydi', async () => {
    const result = await processImage({
      source: await sourceImage(800, 600),
      outputRoot,
      listingId: 'bx-002',
      position: 1,
      makeOg: false,
    });

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("ogYasa=true bo'lganda 1200x630 crop yozadi", async () => {
    const result = await processImage({
      source: await sourceImage(2000, 1500),
      outputRoot,
      listingId: 'bx-001',
      position: 1,
      makeOg: true,
    });

    expect(result.ogUrl).toBe('/images/bx-001/og.jpg');
    const og = await sharp(join(outputRoot, 'images/bx-001/og.jpg')).metadata();
    expect(og.width).toBe(1200);
    expect(og.height).toBe(630);
  });

  it("ogYasa=false bo'lganda ogUrl null", async () => {
    const result = await processImage({
      source: await sourceImage(2000, 1500),
      outputRoot,
      listingId: 'bx-001',
      position: 2,
      makeOg: false,
    });

    expect(result.ogUrl).toBeNull();
    expect(result.base).toBe('/images/bx-001/02');
  });

  it('har variant 250 KB dan kichik', async () => {
    await processImage({
      source: await sourceImage(2400, 1800),
      outputRoot,
      listingId: 'bx-001',
      position: 1,
      makeOg: false,
    });

    const large = await readFile(join(outputRoot, 'images/bx-001/01-1200.jpg'));
    expect(large.byteLength).toBeLessThan(250 * 1024);
  });

  it("@rieltor/shared o'quvchisi bilan round-trip mos keladi (yozuvchi va o'quvchi ayrilib qolmasligi uchun)", async () => {
    const result = await processImage({
      source: await sourceImage(2400, 1800),
      outputRoot,
      listingId: 'bx-001',
      position: 1,
      makeOg: false,
    });

    // Manba IMAGE_MAX_WIDTH'dan kattaroq — natija.width aynan shu qiymatga teng bo'lishi kerak.
    expect(result.width).toBe(IMAGE_MAX_WIDTH);

    // srcset'dagi har bir URL'ni pipeline haqiqatan yozgan faylga xaritalaymiz.
    const srcset = imageSrcSet(result.base);
    const urls = srcset.split(', ').map((part) => {
      const [url] = part.split(' ');
      if (!url) throw new Error(`srcset qismi bo'sh: "${part}"`);
      return url;
    });
    expect(urls).toHaveLength(IMAGE_WIDTHS.length);

    for (const url of urls) {
      const file = join(outputRoot, url);
      const info = await stat(file);
      expect(info.isFile()).toBe(true);
    }

    // Fallback URL ham xuddi shu tarzda haqiqiy faylga borishi kerak.
    const fallbackUrl = imageFallbackSrc(result.base);
    const fallbackInfo = await stat(join(outputRoot, fallbackUrl));
    expect(fallbackInfo.isFile()).toBe(true);
  });
});
