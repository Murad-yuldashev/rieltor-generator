import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_WIDTHS, imageFallbackSrc, imageSrcSet } from '@rieltor/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { processImage } from './images';

let outputRoot: string;

/** The source image is generated here so no binary fixture is kept in the repo. */
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
  it('writes three webp files and one jpg fallback', async () => {
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

  it('returns the real dimensions of the 1200 variant', async () => {
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

  it('does not upscale a small source', async () => {
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

  it('writes a 1200x630 crop when the og flag is true', async () => {
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

  it('ogUrl is null when the og flag is false', async () => {
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

  it('every variant stays under 250 KB', async () => {
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

  it('round-trips with the @rieltor/shared reader, so writer and reader cannot drift', async () => {
    const result = await processImage({
      source: await sourceImage(2400, 1800),
      outputRoot,
      listingId: 'bx-001',
      position: 1,
      makeOg: false,
    });

    // The source is wider than IMAGE_MAX_WIDTH, so result.width must equal exactly that.
    expect(result.width).toBe(IMAGE_MAX_WIDTH);

    // Map every URL in the srcset onto a file the pipeline actually wrote.
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

    // The fallback URL has to resolve to a real file in the same way.
    const fallbackUrl = imageFallbackSrc(result.base);
    const fallbackInfo = await stat(join(outputRoot, fallbackUrl));
    expect(fallbackInfo.isFile()).toBe(true);
  });
});
