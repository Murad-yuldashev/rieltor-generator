import type { PrismaService } from '../prisma/prisma.service';

/**
 * Fixed Telegram id for the single shared realtor DEMO_MODE authenticates every request as.
 * Deliberately the same id the dev-login form uses (DEV_TG_ID in dev-login-form.tsx), so
 * dev-login and DEMO_MODE land on one shared test realtor instead of two parallel ones.
 */
const DEMO_TG_ID = 424242n;

/**
 * Upserts the one realtor every request is signed in as while DEMO_MODE is on. Created
 * on first use, so it also works on a fresh database (e.g. a Netlify demo deploy) where
 * no Telegram login has ever run to create a realtor row. The phone is pre-filled so the
 * demo can publish listings without first completing a profile (spec: phone is required
 * before publishing).
 */
export async function ensureDemoRealtor(prisma: PrismaService): Promise<string> {
  const { id } = await prisma.realtor.upsert({
    where: { tgId: DEMO_TG_ID },
    update: {},
    create: {
      tgId: DEMO_TG_ID,
      username: 'demo',
      name: 'Demo Rieltor',
      phone: '+998900000000',
      phoneVerified: true,
    },
    select: { id: true },
  });

  return id;
}
