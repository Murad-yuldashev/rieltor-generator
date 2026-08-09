import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { processImage } from './images';
import { makeAgentPlaceholder, makePlaceholder } from './placeholders';
import { SEED_LISTINGS } from './seed-data';

const prisma = new PrismaClient();

const API_ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = join(API_ROOT, 'public');
const SOURCE_ROOT = join(API_ROOT, 'prisma', 'seed-images');
const AGENT_ID = 'agent-1';

/**
 * Reads the files in seed-images/<id>/ in order, falling back to placeholders
 * when the folder is empty. `placeholderCount` applies only to the placeholder
 * path — when real files exist, however many there are (files.length) is how
 * many images get used, and `placeholderCount` is ignored.
 */
async function readSourceImages(
  listingId: string,
  placeholderCount: number,
): Promise<(string | Buffer)[]> {
  let files: string[] = [];
  try {
    files = (await readdir(join(SOURCE_ROOT, listingId)))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
  } catch {
    files = [];
  }

  if (files.length === 0) {
    console.log(`  ${listingId}: manba rasm topilmadi, placeholder ishlatiladi`);
    return Promise.all(
      Array.from({ length: placeholderCount }, (_, i) => makePlaceholder(listingId, i + 1)),
    );
  }

  return files.map((f) => join(SOURCE_ROOT, listingId, f));
}

async function seedAgent() {
  const phone = process.env.SEED_AGENT_TEL;
  const telegram = process.env.SEED_AGENT_TG;
  if (!phone || !telegram) {
    throw new Error(
      "SEED_AGENT_TEL va SEED_AGENT_TG env o'zgaruvchilari kerak (.env.example ga qara)",
    );
  }

  const photoPath = join(PUBLIC_ROOT, 'images', 'agents');
  await mkdir(photoPath, { recursive: true });
  await writeFile(join(photoPath, `${AGENT_ID}.jpg`), await makeAgentPlaceholder());

  return prisma.agent.upsert({
    where: { id: AGENT_ID },
    update: { name: 'Rieltor', agency: "Toshkent Ko'chmas Mulk", phone, telegram },
    create: {
      id: AGENT_ID,
      name: 'Rieltor',
      agency: "Toshkent Ko'chmas Mulk",
      photoUrl: `/images/agents/${AGENT_ID}.jpg`,
      phone,
      telegram,
    },
  });
}

async function main() {
  await seedAgent();

  for (const listing of SEED_LISTINGS) {
    console.log(`${listing.id} seed qilinmoqda...`);

    // upsert so a re-run does not reset the view counter to zero.
    await prisma.listing.upsert({
      where: { id: listing.id },
      update: {
        title: listing.title,
        priceSom: listing.priceSom,
        priceUsd: listing.priceUsd,
        rooms: listing.rooms,
        areaM2: listing.areaM2,
        floor: listing.floor,
        district: listing.district,
        address: listing.address,
        landmark: listing.landmark,
        description: listing.description,
        type: listing.type,
        deal: listing.deal,
        listedAt: new Date(listing.listedAt),
      },
      create: {
        id: listing.id,
        title: listing.title,
        priceSom: listing.priceSom,
        priceUsd: listing.priceUsd,
        rooms: listing.rooms,
        areaM2: listing.areaM2,
        floor: listing.floor,
        district: listing.district,
        address: listing.address,
        landmark: listing.landmark,
        description: listing.description,
        type: listing.type,
        deal: listing.deal,
        listedAt: new Date(listing.listedAt),
        agentId: AGENT_ID,
      },
    });

    const sources = await readSourceImages(listing.id, listing.placeholderCount);

    // Rasmlar to'liq qayta yaratiladi — fayl nomlari tartibga bog'liq.
    await prisma.image.deleteMany({ where: { listingId: listing.id } });

    for (const [i, source] of sources.entries()) {
      const result = await processImage({
        source,
        outputRoot: PUBLIC_ROOT,
        listingId: listing.id,
        position: i + 1,
        makeOg: i === 0,
      });

      await prisma.image.create({
        data: {
          listingId: listing.id,
          base: result.base,
          ogUrl: result.ogUrl,
          width: result.width,
          height: result.height,
          position: i + 1,
        },
      });
    }

    console.log(`  ${sources.length} rasm qayta ishlandi`);
  }
}

main()
  .then(() => console.log('Seed tugadi.'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
