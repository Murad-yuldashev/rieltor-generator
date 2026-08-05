import sharp from 'sharp';

const COLORS: Record<string, { r: number; g: number; b: number }> = {
  'bx-001': { r: 29, g: 78, b: 216 },
  'bx-002': { r: 15, g: 118, b: 110 },
  'bx-003': { r: 133, g: 77, b: 14 },
  'bx-004': { r: 190, g: 18, b: 60 },
  'bx-005': { r: 4, g: 120, b: 87 },
  'bx-006': { r: 109, g: 40, b: 217 },
  'bx-007': { r: 14, g: 116, b: 144 },
  'bx-008': { r: 180, g: 83, b: 9 },
  'bx-009': { r: 162, g: 28, b: 175 },
  'bx-010': { r: 77, g: 124, b: 15 },
};

/**
 * Flat-colour 1600×1200 image used when no source photo is available.
 * Keeps binaries out of the repo — drop real photos into
 * prisma/seed-images/<id>/ and the seed picks them up automatically.
 */
export async function makePlaceholder(listingId: string, position: number): Promise<Buffer> {
  const baseColor = COLORS[listingId] ?? { r: 100, g: 116, b: 139 };
  const brightnessStep = position * 12;
  return sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: {
        r: Math.min(255, baseColor.r + brightnessStep),
        g: Math.min(255, baseColor.g + brightnessStep),
        b: Math.min(255, baseColor.b + brightnessStep),
      },
    },
  })
    .jpeg()
    .toBuffer();
}

export async function makeAgentPlaceholder(): Promise<Buffer> {
  return sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: 148, g: 163, b: 184 } },
  })
    .jpeg()
    .toBuffer();
}
