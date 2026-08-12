import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderImageVariants } from '../src/media/variants';

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

/**
 * Thin disk-writing shell around the buffer-only core in src/media/variants.ts
 * (design spec §6.2). Kept here — with this exact exported signature — so seed.ts
 * and prisma/images.test.ts need zero changes; the test is the refactor's safety net.
 */
export async function processImage(opts: ProcessImageOptions): Promise<ProcessedImage> {
  const { source, outputRoot, listingId, position, makeOg } = opts;

  const outputDir = join(outputRoot, 'images', listingId);
  await mkdir(outputDir, { recursive: true });

  const fileName = String(position).padStart(2, '0');
  const base = `/images/${listingId}/${fileName}`;

  // The buffer-only core has no filesystem access, so a source path is read in first.
  const buffer = typeof source === 'string' ? await readFile(source) : source;
  const rendered = await renderImageVariants(buffer);

  await Promise.all(
    rendered.variants.map((variant) =>
      writeFile(join(outputDir, `${fileName}-${variant.name}`), variant.body),
    ),
  );

  let ogUrl: string | null = null;
  if (makeOg && rendered.og) {
    await writeFile(join(outputDir, 'og.jpg'), rendered.og);
    ogUrl = `/images/${listingId}/og.jpg`;
  }

  return { base, ogUrl, width: rendered.width, height: rendered.height };
}
