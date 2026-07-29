import sharp from 'sharp';

const RANGLAR: Record<string, { r: number; g: number; b: number }> = {
  'bx-001': { r: 29, g: 78, b: 216 },
  'bx-002': { r: 15, g: 118, b: 110 },
  'bx-003': { r: 133, g: 77, b: 14 },
};

/**
 * Manba rasm topilmasa ishlatiladigan bir rangli 1600×1200 surat.
 * Repo'da binar fayl saqlamaslik uchun — real rasmlar
 * prisma/seed-images/<id>/ ga qo'yilsa, seed avtomatik ularni oladi.
 */
export async function placeholderYasa(objectId: string, tartib: number): Promise<Buffer> {
  const asos = RANGLAR[objectId] ?? { r: 100, g: 116, b: 139 };
  const ochlik = tartib * 12;
  return sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: {
        r: Math.min(255, asos.r + ochlik),
        g: Math.min(255, asos.g + ochlik),
        b: Math.min(255, asos.b + ochlik),
      },
    },
  })
    .jpeg()
    .toBuffer();
}

export async function agentPlaceholder(): Promise<Buffer> {
  return sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: 148, g: 163, b: 184 } },
  })
    .jpeg()
    .toBuffer();
}
