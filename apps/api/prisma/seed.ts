import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { rasmniQayta } from './images';
import { agentPlaceholder, placeholderYasa } from './placeholders';
import { SEED_OBJECTS } from './seed-data';

const prisma = new PrismaClient();

const API_ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = join(API_ROOT, 'public');
const MANBA_ROOT = join(API_ROOT, 'prisma', 'seed-images');
const AGENT_ID = 'agent-1';

/**
 * seed-images/<id>/ dagi fayllarni tartib bo'yicha o'qiydi; bo'sh bo'lsa
 * placeholder qaytaradi. `placeholderSoni` faqat placeholder yo'lida
 * ishlatiladi — haqiqiy fayllar mavjud bo'lsa, ularning soni (fayllar.length)
 * qancha bo'lsa, o'shancha rasm ishlatiladi, `placeholderSoni`ga qaralmaydi.
 */
async function manbalarniOl(
  objectId: string,
  placeholderSoni: number,
): Promise<(string | Buffer)[]> {
  let fayllar: string[] = [];
  try {
    fayllar = (await readdir(join(MANBA_ROOT, objectId)))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
  } catch {
    fayllar = [];
  }

  if (fayllar.length === 0) {
    console.log(`  ${objectId}: manba rasm topilmadi, placeholder ishlatiladi`);
    return Promise.all(
      Array.from({ length: placeholderSoni }, (_, i) => placeholderYasa(objectId, i + 1)),
    );
  }

  return fayllar.map((f) => join(MANBA_ROOT, objectId, f));
}

async function agentniSeed() {
  const tel = process.env.SEED_AGENT_TEL;
  const tg = process.env.SEED_AGENT_TG;
  if (!tel || !tg) {
    throw new Error(
      "SEED_AGENT_TEL va SEED_AGENT_TG env o'zgaruvchilari kerak (.env.example ga qara)",
    );
  }

  const suratYoli = join(PUBLIC_ROOT, 'images', 'agents');
  await mkdir(suratYoli, { recursive: true });
  await writeFile(join(suratYoli, `${AGENT_ID}.jpg`), await agentPlaceholder());

  return prisma.agent.upsert({
    where: { id: AGENT_ID },
    update: { tel, tg },
    create: {
      id: AGENT_ID,
      ism: 'Rieltor',
      agentlik: "Buxoro Ko'chmas Mulk",
      suratUrl: `/images/agents/${AGENT_ID}.jpg`,
      tel,
      tg,
    },
  });
}

async function main() {
  await agentniSeed();

  for (const obj of SEED_OBJECTS) {
    console.log(`${obj.id} seed qilinmoqda...`);

    // upsert — qayta ishga tushirilganda views nolga tushmasligi kerak.
    await prisma.object.upsert({
      where: { id: obj.id },
      update: {
        sarlavha: obj.sarlavha,
        narxSom: obj.narxSom,
        narxUsd: obj.narxUsd,
        xona: obj.xona,
        maydonM2: obj.maydonM2,
        qavat: obj.qavat,
        tuman: obj.tuman,
        manzil: obj.manzil,
        moljal: obj.moljal,
        tavsif: obj.tavsif,
        turi: obj.turi,
        sana: new Date(obj.sana),
      },
      create: {
        id: obj.id,
        sarlavha: obj.sarlavha,
        narxSom: obj.narxSom,
        narxUsd: obj.narxUsd,
        xona: obj.xona,
        maydonM2: obj.maydonM2,
        qavat: obj.qavat,
        tuman: obj.tuman,
        manzil: obj.manzil,
        moljal: obj.moljal,
        tavsif: obj.tavsif,
        turi: obj.turi,
        sana: new Date(obj.sana),
        agentId: AGENT_ID,
      },
    });

    const manbalar = await manbalarniOl(obj.id, obj.placeholderSoni);

    // Rasmlar to'liq qayta yaratiladi — fayl nomlari tartibga bog'liq.
    await prisma.rasm.deleteMany({ where: { objectId: obj.id } });

    for (const [i, manba] of manbalar.entries()) {
      const natija = await rasmniQayta({
        manba,
        chiqishRoot: PUBLIC_ROOT,
        objectId: obj.id,
        tartib: i + 1,
        ogYasa: i === 0,
      });

      await prisma.rasm.create({
        data: {
          objectId: obj.id,
          base: natija.base,
          ogUrl: natija.ogUrl,
          width: natija.width,
          height: natija.height,
          tartib: i + 1,
        },
      });
    }

    console.log(`  ${manbalar.length} rasm qayta ishlandi`);
  }
}

main()
  .then(() => console.log('Seed tugadi.'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
