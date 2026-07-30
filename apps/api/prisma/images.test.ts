import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_WIDTHS, imageFallbackSrc, imageSrcSet } from '@rieltor/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rasmniQayta } from './images';

let chiqishRoot: string;

/** Testda binar fayl saqlamaslik uchun manba rasm shu yerda generatsiya qilinadi. */
async function manbaRasm(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 90, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}

beforeEach(async () => {
  chiqishRoot = await mkdtemp(join(tmpdir(), 'rieltor-img-'));
});

afterEach(async () => {
  await rm(chiqishRoot, { recursive: true, force: true });
});

describe('rasmniQayta', () => {
  it('uchta webp va bitta jpg fallback yozadi', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    expect(natija.base).toBe('/images/bx-001/01');

    for (const w of [360, 720, 1200]) {
      const meta = await sharp(join(chiqishRoot, `images/bx-001/01-${w}.webp`)).metadata();
      expect(meta.width).toBe(w);
      expect(meta.format).toBe('webp');
    }

    const fallback = await sharp(join(chiqishRoot, 'images/bx-001/01-1200.jpg')).metadata();
    expect(fallback.format).toBe('jpeg');
    expect(fallback.width).toBe(1200);
  });

  it("1200 variantining haqiqiy o'lchamini qaytaradi", async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    expect(natija.width).toBe(1200);
    expect(natija.height).toBe(900);
  });

  it('kichik manbani kattalashtirmaydi', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(800, 600),
      chiqishRoot,
      objectId: 'bx-002',
      tartib: 1,
      ogYasa: false,
    });

    expect(natija.width).toBe(800);
    expect(natija.height).toBe(600);
  });

  it("ogYasa=true bo'lganda 1200x630 crop yozadi", async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: true,
    });

    expect(natija.ogUrl).toBe('/images/bx-001/og.jpg');
    const og = await sharp(join(chiqishRoot, 'images/bx-001/og.jpg')).metadata();
    expect(og.width).toBe(1200);
    expect(og.height).toBe(630);
  });

  it("ogYasa=false bo'lganda ogUrl null", async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 2,
      ogYasa: false,
    });

    expect(natija.ogUrl).toBeNull();
    expect(natija.base).toBe('/images/bx-001/02');
  });

  it('har variant 250 KB dan kichik', async () => {
    await rasmniQayta({
      manba: await manbaRasm(2400, 1800),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    const katta = await readFile(join(chiqishRoot, 'images/bx-001/01-1200.jpg'));
    expect(katta.byteLength).toBeLessThan(250 * 1024);
  });

  it("@rieltor/shared o'quvchisi bilan round-trip mos keladi (yozuvchi va o'quvchi ayrilib qolmasligi uchun)", async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2400, 1800),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    // Manba IMAGE_MAX_WIDTH'dan kattaroq — natija.width aynan shu qiymatga teng bo'lishi kerak.
    expect(natija.width).toBe(IMAGE_MAX_WIDTH);

    // srcset'dagi har bir URL'ni pipeline haqiqatan yozgan faylga xaritalaymiz.
    const srcset = imageSrcSet(natija.base);
    const urls = srcset.split(', ').map((qism) => {
      const [url] = qism.split(' ');
      if (!url) throw new Error(`srcset qismi bo'sh: "${qism}"`);
      return url;
    });
    expect(urls).toHaveLength(IMAGE_WIDTHS.length);

    for (const url of urls) {
      const fayl = join(chiqishRoot, url);
      const info = await stat(fayl);
      expect(info.isFile()).toBe(true);
    }

    // Fallback URL ham xuddi shu tarzda haqiqiy faylga borishi kerak.
    const fallbackUrl = imageFallbackSrc(natija.base);
    const fallbackInfo = await stat(join(chiqishRoot, fallbackUrl));
    expect(fallbackInfo.isFile()).toBe(true);
  });
});
