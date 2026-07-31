import sharp from 'sharp';

const COLORS: Record<string, { r: number; g: number; b: number }> = {
  'bx-001': { r: 29, g: 78, b: 216 },
  'bx-002': { r: 15, g: 118, b: 110 },
  'bx-003': { r: 133, g: 77, b: 14 },
};

/**
 * Manba rasm topilmasa ishlatiladigan bir rangli 1600×1200 surat.
 * Repo'da binar fayl saqlamaslik uchun — real rasmlar
 * prisma/seed-images/<id>/ ga qo'yilsa, seed avtomatik ularni oladi.
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
