import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { processImage } from './images';
import { makeAgentPlaceholder, makePlaceholder } from './placeholders';
import { seedDeveloperCrm } from './seed-crm';
import { mortgagePrograms, SEED_ARTICLES, SEED_LISTINGS } from './seed-data';
import { seedRealtorCabinet } from './seed-realtor';

const prisma = new PrismaClient();

const API_ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = join(API_ROOT, 'public');
const SOURCE_ROOT = join(API_ROOT, 'prisma', 'seed-images');
const AGENT_ID = 'agent-1';

/**
 * Fixed phone (E.164 without the plus) that identifies the seed MODERATOR user.
 * The seed creates no other User rows, and Article.authorId is a required FK to
 * User — so this moderator is upserted (idempotently by phone) before any
 * article, and is also the principal for the T4 moderation HTTP check.
 */
const SEED_MODERATOR_PHONE = '998900000000';

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

/**
 * Idempotently upsert the seed MODERATOR user (keyed by phone) and return its id.
 * Every seeded article is authored by this user.
 */
async function seedModerator(): Promise<string> {
  const moderator = await prisma.user.upsert({
    where: { phone: SEED_MODERATOR_PHONE },
    update: { name: 'Uysot Jurnal', role: 'MODERATOR' },
    create: {
      phone: SEED_MODERATOR_PHONE,
      name: 'Uysot Jurnal',
      role: 'MODERATOR',
    },
  });
  return moderator.id;
}

async function main() {
  await seedAgent();

  const moderatorId = await seedModerator();

  // Demo journal articles (7.4). Upsert by slug so a re-run does not duplicate,
  // and seeded as PUBLISHED so the public journal has content out of the box.
  for (const article of SEED_ARTICLES) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        category: article.category,
        status: 'PUBLISHED',
        publishedAt: article.publishedAt,
        authorId: moderatorId,
      },
      create: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        category: article.category,
        status: 'PUBLISHED',
        publishedAt: article.publishedAt,
        authorId: moderatorId,
      },
    });
    console.log(`  maqola seed qilindi: ${article.slug}`);
  }
  console.log(`${SEED_ARTICLES.length} maqola seed qilindi (muallif: moderator)`);

  // Illustrative mortgage programs (7.1). Count-guarded so a re-run does not
  // duplicate — MortgageProgram has no natural unique key (id is a cuid).
  if ((await prisma.mortgageProgram.count()) === 0) {
    await prisma.mortgageProgram.createMany({ data: mortgagePrograms });
    console.log(`${mortgagePrograms.length} ipoteka dasturi seed qilindi`);
  }

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
        latitude: listing.latitude,
        longitude: listing.longitude,
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
        latitude: listing.latitude,
        longitude: listing.longitude,
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

  // Developer-CRM demo data (Phase 8.2). Additive + idempotent (guarded on
  // Organization count), so it runs once and a re-run is a no-op.
  await seedDeveloperCrm(prisma);

  // Realtor cabinet demo data (Phase 8.3). Additive + idempotent (guarded on
  // Subscription count). MUST run after seedDeveloperCrm — its fixation/lead
  // chain FKs into the CRM units minted above.
  await seedRealtorCabinet(prisma);
}

main()
  .then(() => console.log('Seed tugadi.'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
