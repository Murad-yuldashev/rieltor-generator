import sharp from 'sharp';

/** 8x8 → 64 bits, one hex character per 4 bits = 16 hex characters. */
const HASH_SIZE = 8;
const HEX_LENGTH = (HASH_SIZE * HASH_SIZE) / 4;

/**
 * Classic average-hash (aHash): shrink to 8x8 grayscale, threshold every pixel
 * against the mean, pack the 64 bits into a hex string. Cheap and good enough to
 * start populating Image.phash (design spec §6/§9.2); comparing hashes and flagging
 * duplicates is explicitly out of scope for this stage.
 */
export async function computePHash(source: Buffer): Promise<string> {
  const { data } = await sharp(source)
    .resize(HASH_SIZE, HASH_SIZE, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;

  let bits = 0n;
  for (const value of data) {
    bits = (bits << 1n) | (value >= mean ? 1n : 0n);
  }

  return bits.toString(16).padStart(HEX_LENGTH, '0');
}
