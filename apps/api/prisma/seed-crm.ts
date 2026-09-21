import { join, resolve } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { processImage } from './images';
import { makePlaceholder } from './placeholders';

/**
 * Developer-CRM demo seed (Phase 8.2, Task 1 — the enabler).
 *
 * Additive and idempotent: the whole chain is created only when there is no
 * Organization yet, so a re-run is a no-op. Log in as SEED_DEVELOPER_PHONE to
 * land in a populated developer cabinet (verified org -> complexes -> buildings
 * -> units -> bookings -> contracts -> wallet). Every later Phase 8.2 task's
 * live check consumes the fixed ids minted here.
 *
 * NOTE ON FIELDS (schema is the ground truth, verified against schema.prisma):
 *  - `Unit` has NO `hasActiveFixation` column — the developer service DERIVES it
 *    from ACTIVE Fixation rows, so we never pass it to `unit.create`. Fixations
 *    need an out-of-scope realtor -> PropertyRequest -> Fixation chain and are
 *    skipped this phase (the "Fiksatsiya" column renders empty — acceptable).
 *  - `Booking` has NO `orgId` column — the org is reached via
 *    unit -> building -> complex -> org. Bookings carry `createdById` only.
 *  - `Contract.bookingId` is a required @unique 1:1 FK, so every Contract wraps
 *    its OWN distinct CONVERTED Booking on a SOLD unit.
 */

const API_ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = join(API_ROOT, 'public');

/** Fixed phone (E.164 without the plus) of the seed DEVELOPER (org OWNER). */
export const SEED_DEVELOPER_PHONE = '998900000001';
/** Second org member, so the cabinet's members list has two rows. */
const SEED_MANAGER_PHONE = '998900000002';

const SEED_DEVELOPER_ID = 'seed-dev-user-1';
const SEED_MANAGER_ID = 'seed-dev-user-2';
const SEED_ORG_ID = 'seed-org-1';

/** now-relative date helpers (kept out of enum/BigInt paths). */
const now = new Date();
function daysFromNow(days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
function monthsFromNow(months: number): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() + months);
  return d;
}

type UnitStatus = 'AVAILABLE' | 'BOOKED' | 'SOLD';
type ComplexStatus = 'PLANNED' | 'UNDER_CONSTRUCTION' | 'DONE';
type ComplexPublishStatus = 'DRAFT' | 'PUBLISHED';

interface BuildingConfig {
  letter: string;
  floors: number;
  perFloor: number;
}

interface ComplexConfig {
  id: string;
  short: string;
  name: string;
  district: string;
  address: string;
  description: string;
  status: ComplexStatus;
  publishStatus: ComplexPublishStatus;
  slug: string | null;
  published: boolean;
  commissionBps: number | null;
  latitude: number;
  longitude: number;
  imageCount: number;
  /** 'priced' = normal AVAILABLE/BOOKED/SOLD mix; 'unpriced' = AVAILABLE but no price (fails publish gate). */
  pricing: 'priced' | 'unpriced';
  buildings: BuildingConfig[];
}

/**
 * Four complexes across four distinct Tashkent districts: mixed status
 * (PLANNED / UNDER_CONSTRUCTION x2 / DONE) and publish state (2 PUBLISHED with
 * slug, 2 DRAFT). cx-1 & cx-2 clear the publish gate (verified org + image +
 * priced AVAILABLE unit); cx-4 is a DRAFT that deliberately does NOT (its units
 * are AVAILABLE but unpriced).
 */
const COMPLEXES: ComplexConfig[] = [
  {
    id: 'seed-cx-1',
    short: 'cx1',
    name: 'Yashil Vodiy',
    district: 'Yunusobod tumani',
    address: "Yunusobod tumani, Amir Temur shox ko'chasi 108",
    description:
      'Yunusobodning markazida zamonaviy turar-joy majmuasi. Yopiq hovli, yer osti avtoturargohi va bolalar maydonchalari bilan.',
    status: 'UNDER_CONSTRUCTION',
    publishStatus: 'PUBLISHED',
    slug: 'yashil-vodiy',
    published: true,
    commissionBps: 200,
    latitude: 41.365,
    longitude: 69.289,
    imageCount: 4,
    pricing: 'priced',
    buildings: [
      { letter: 'A', floors: 12, perFloor: 4 },
      { letter: 'B', floors: 10, perFloor: 4 },
    ],
  },
  {
    id: 'seed-cx-2',
    short: 'cx2',
    name: 'Chilonzor Towers',
    district: 'Chilonzor tumani',
    address: "Chilonzor tumani, Bunyodkor shox ko'chasi 45",
    description:
      "Chilonzorda ikki minorali biznes-klass majmuasi. Metrogacha piyoda besh daqiqa, savdo markazi binoning o'zida.",
    status: 'UNDER_CONSTRUCTION',
    publishStatus: 'PUBLISHED',
    slug: 'chilonzor-towers',
    published: true,
    commissionBps: 150,
    latitude: 41.285,
    longitude: 69.204,
    imageCount: 1,
    pricing: 'priced',
    buildings: [{ letter: 'A', floors: 14, perFloor: 4 }],
  },
  {
    id: 'seed-cx-3',
    short: 'cx3',
    name: 'Mirobod Rezidensiya',
    district: 'Mirobod tumani',
    address: "Mirobod tumani, Shota Rustaveli ko'chasi 12",
    description:
      "Topshirilgan premium majmua. Xonadonlar to'liq ta'mir bilan, hovli obodonlashtirilgan.",
    status: 'DONE',
    publishStatus: 'DRAFT',
    slug: null,
    published: false,
    commissionBps: null,
    latitude: 41.299,
    longitude: 69.276,
    imageCount: 1,
    pricing: 'priced',
    buildings: [{ letter: 'A', floors: 9, perFloor: 4 }],
  },
  {
    id: 'seed-cx-4',
    short: 'cx4',
    name: 'Sergeli Park',
    district: 'Sergeli tumani',
    address: "Sergeli tumani, Yangi Sergeli ko'chasi 7",
    description: "Loyihalash bosqichidagi keng majmua. Narxlar hali e'lon qilinmagan.",
    status: 'PLANNED',
    publishStatus: 'DRAFT',
    slug: null,
    published: false,
    commissionBps: null,
    latitude: 41.223,
    longitude: 69.223,
    imageCount: 1,
    pricing: 'unpriced',
    buildings: [{ letter: 'A', floors: 16, perFloor: 4 }],
  },
];

/** ~60% AVAILABLE / 25% BOOKED / 15% SOLD, deterministic (12/5/3 per 20). */
const STATUS_PATTERN: UnitStatus[] = [
  'AVAILABLE',
  'AVAILABLE',
  'BOOKED',
  'AVAILABLE',
  'SOLD',
  'AVAILABLE',
  'AVAILABLE',
  'BOOKED',
  'AVAILABLE',
  'AVAILABLE',
  'BOOKED',
  'SOLD',
  'AVAILABLE',
  'AVAILABLE',
  'BOOKED',
  'AVAILABLE',
  'AVAILABLE',
  'SOLD',
  'AVAILABLE',
  'BOOKED',
];

const ROOM_BASE_PRICE: Record<number, bigint> = {
  1: 520_000_000n,
  2: 780_000_000n,
  3: 1_050_000_000n,
  4: 1_380_000_000n,
};
const ROOM_BASE_AREA: Record<number, number> = { 1: 39, 2: 58, 3: 83, 4: 112 };

interface GeneratedUnit {
  id: string;
  buildingId: string;
  number: string;
  floor: number;
  rooms: number;
  areaM2: number;
  priceSom: bigint | null;
  status: UnitStatus;
  commissionBps: number | null;
}

interface GeneratedBuilding {
  id: string;
  complexId: string;
  name: string;
  floors: number;
}

/** Index into a pool that must be populated; throws (never returns undefined) if it is short. */
function pick<T>(arr: T[], i: number, label: string): T {
  const v = arr[i];
  if (v === undefined) {
    throw new Error(`CRM seed: ${label} pool exhausted at index ${i} (have ${arr.length}).`);
  }
  return v;
}

/** Create `count` placeholder images for a complex through the shared sharp pipeline. */
async function createComplexImages(
  prisma: PrismaClient,
  complexId: string,
  count: number,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    const source = await makePlaceholder(complexId, i + 1);
    const result = await processImage({
      source,
      outputRoot: PUBLIC_ROOT,
      listingId: complexId, // used only as the image folder key: /images/<complexId>/..
      position: i + 1,
      makeOg: i === 0,
    });
    await prisma.complexImage.create({
      data: {
        complexId,
        base: result.base,
        ogUrl: result.ogUrl,
        width: result.width,
        height: result.height,
        position: i,
      },
    });
  }
}

/**
 * Seed a complete developer cabinet. Guarded on Organization count so it runs
 * once; a second invocation returns immediately.
 */
export async function seedDeveloperCrm(prisma: PrismaClient): Promise<void> {
  if ((await prisma.organization.count()) > 0) {
    console.log('CRM seed: tashkilot allaqachon mavjud, o‘tkazib yuborildi.');
    return;
  }

  // --- Users -------------------------------------------------------------
  await prisma.user.create({
    data: {
      id: SEED_DEVELOPER_ID,
      phone: SEED_DEVELOPER_PHONE,
      name: 'Sardor Karimov',
      role: 'DEVELOPER',
    },
  });
  await prisma.user.create({
    data: {
      id: SEED_MANAGER_ID,
      phone: SEED_MANAGER_PHONE,
      name: 'Nodira Yusupova',
      role: 'DEVELOPER',
    },
  });

  // --- Organization + memberships ---------------------------------------
  await prisma.organization.create({
    data: {
      id: SEED_ORG_ID,
      name: 'Karimov Qurilish',
      district: 'Yunusobod tumani',
      verified: true,
      verificationRequestedAt: daysFromNow(-40),
      verifiedAt: daysFromNow(-35),
      verificationNote: 'Hujjatlar tekshirildi.',
    },
  });
  await prisma.membership.createMany({
    data: [
      { id: 'seed-mem-1', orgId: SEED_ORG_ID, userId: SEED_DEVELOPER_ID, role: 'OWNER' },
      { id: 'seed-mem-2', orgId: SEED_ORG_ID, userId: SEED_MANAGER_ID, role: 'MANAGER' },
    ],
  });

  // --- Complexes + images + buildings + units ----------------------------
  const allBuildings: GeneratedBuilding[] = [];
  const allUnits: GeneratedUnit[] = [];

  for (const cx of COMPLEXES) {
    await prisma.complex.create({
      data: {
        id: cx.id,
        orgId: SEED_ORG_ID,
        name: cx.name,
        district: cx.district,
        address: cx.address,
        description: cx.description,
        status: cx.status,
        publishStatus: cx.publishStatus,
        slug: cx.slug,
        publishedAt: cx.published ? daysFromNow(-20) : null,
        latitude: cx.latitude,
        longitude: cx.longitude,
        commissionBps: cx.commissionBps,
      },
    });

    await createComplexImages(prisma, cx.id, cx.imageCount);

    let patternIdx = 0; // per-complex running index into STATUS_PATTERN
    let unitSeq = 0; // per-complex running index for commission overrides

    for (const b of cx.buildings) {
      const buildingId = `seed-bld-${cx.short}-${b.letter}`;
      allBuildings.push({
        id: buildingId,
        complexId: cx.id,
        name: `${b.letter} blok`,
        floors: b.floors,
      });

      for (let floor = 1; floor <= b.floors; floor++) {
        for (let u = 1; u <= b.perFloor; u++) {
          const rooms = ((floor + u) % 4) + 1;
          const areaM2 = (ROOM_BASE_AREA[rooms] ?? 58) + u * 1.5;
          const status: UnitStatus =
            cx.pricing === 'unpriced'
              ? 'AVAILABLE'
              : (STATUS_PATTERN[patternIdx % STATUS_PATTERN.length] ?? 'AVAILABLE');
          patternIdx++;
          const priceSom =
            cx.pricing === 'unpriced'
              ? null
              : (ROOM_BASE_PRICE[rooms] ?? 780_000_000n) + BigInt(floor) * 6_000_000n;
          const commissionBps = unitSeq % 17 === 0 && cx.pricing === 'priced' ? 250 : null;
          unitSeq++;

          allUnits.push({
            id: `seed-unit-${cx.short}-${b.letter}-${floor}-${u}`,
            buildingId,
            number: `${floor}${String(u).padStart(2, '0')}`,
            floor,
            rooms,
            areaM2: Math.round(areaM2 * 10) / 10,
            priceSom,
            status,
            commissionBps,
          });
        }
      }
    }
  }

  await prisma.building.createMany({ data: allBuildings });
  await prisma.unit.createMany({ data: allUnits });

  // Pools for bookings/contracts, drawn only from priced complexes.
  const pricedUnits = allUnits.filter((u) => u.priceSom !== null);
  const soldUnits = pricedUnits.filter((u) => u.status === 'SOLD');
  const bookedUnits = pricedUnits.filter((u) => u.status === 'BOOKED');
  const availableUnits = pricedUnits.filter((u) => u.status === 'AVAILABLE');

  // --- Bookings ----------------------------------------------------------
  // Booking has createdById (required) + unitId; NO orgId column.
  const clientNames = [
    'Aziz Qodirov',
    'Nigora Ismoilova',
    'Farrux Sobirov',
    'Kamola Rashidova',
    'Ulugbek Toshev',
    'Zarina Umarova',
  ];
  const bookings: {
    id: string;
    unitId: string;
    clientName: string;
    clientPhone: string;
    holdUntil: Date;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'CONVERTED';
    note: string | null;
    cancelReason: string | null;
    createdById: string;
    createdAt: Date;
  }[] = [];

  // One ACTIVE hold PER BOOKED unit, so the set of BOOKED units EQUALS the set of units
  // with an ACTIVE booking. This keeps every BOOKED cell's building-detail panel populated
  // (activeBooking with clientName/clientPhone/holdUntil, per spec §10) and makes the
  // building "Band" count match the dashboard "Faol bandlar". The first two holds expire
  // within 3 days (the renewal-nudge case); the rest carry a comfortable future hold.
  // Deterministic (fixed ids/values) so the seed stays idempotent.
  bookedUnits.forEach((unit, i) => {
    const holdDays = i === 0 ? 2 : i === 1 ? 1 : 10 + (i % 20);
    bookings.push({
      id: `seed-bk-active-${i + 1}`,
      unitId: unit.id,
      clientName: pick(clientNames, i % clientNames.length, 'client'),
      clientPhone: `99890${String(3000000 + i).padStart(7, '0')}`,
      holdUntil: daysFromNow(holdDays),
      status: 'ACTIVE',
      note: i === 0 ? 'Mijoz avans to‘lashga tayyor.' : null,
      cancelReason: null,
      createdById: SEED_DEVELOPER_ID,
      createdAt: daysFromNow(-(i + 1)),
    });
  });

  // 2 EXPIRED holds (holdUntil in the past) on now-freed AVAILABLE units.
  [5, 12].forEach((d, i) => {
    const unit = pick(availableUnits, i, 'AVAILABLE');
    bookings.push({
      id: `seed-bk-expired-${i + 1}`,
      unitId: unit.id,
      clientName: pick(clientNames, (i + 2) % clientNames.length, 'client'),
      clientPhone: `99890${String(3100000 + i).padStart(7, '0')}`,
      holdUntil: daysFromNow(-d),
      status: 'EXPIRED',
      note: null,
      cancelReason: null,
      createdById: SEED_DEVELOPER_ID,
      createdAt: daysFromNow(-(d + 5)),
    });
  });

  // 2 CANCELLED holds (cancelReason set) on AVAILABLE units.
  ['Mijoz fikridan qaytdi', 'To‘lov muddati kelishilmadi'].forEach((reason, i) => {
    const unit = pick(availableUnits, i + 2, 'AVAILABLE');
    bookings.push({
      id: `seed-bk-cancelled-${i + 1}`,
      unitId: unit.id,
      clientName: pick(clientNames, (i + 4) % clientNames.length, 'client'),
      clientPhone: `99890${String(3200000 + i).padStart(7, '0')}`,
      holdUntil: daysFromNow(7),
      status: 'CANCELLED',
      note: null,
      cancelReason: reason,
      createdById: SEED_DEVELOPER_ID,
      createdAt: daysFromNow(-(i + 8)),
    });
  });

  // --- Contracts (each wraps its OWN distinct CONVERTED booking) ---------
  const CONTRACT_COUNT = 7;
  const buyerNames = [
    'Jasur Rahimov',
    'Dilnoza Karimova',
    'Bekzod Tursunov',
    'Malika Yusupova',
    'Sherzod Aliyev',
    'Gulnora Saidova',
    'Otabek Nazarov',
  ];

  interface ContractPlan {
    idx: number;
    unit: GeneratedUnit;
    bookingId: string;
    number: string;
    buyerName: string;
    buyerPhone: string;
    status: 'ACTIVE' | 'CANCELLED';
    signed: boolean;
    agreed: boolean;
    withSchedule: boolean;
  }

  const contractPlans: ContractPlan[] = [];
  for (let i = 0; i < CONTRACT_COUNT; i++) {
    const unit = pick(soldUnits, i, 'SOLD');
    const buyerName = pick(buyerNames, i, 'buyer');
    const buyerPhone = `99890${String(4000000 + i).padStart(7, '0')}`;
    const convertedBookingId = `seed-bk-converted-${i + 1}`;
    // Dedicated CONVERTED booking, one per contract, on the SOLD unit.
    bookings.push({
      id: convertedBookingId,
      unitId: unit.id,
      clientName: buyerName,
      clientPhone: buyerPhone,
      holdUntil: daysFromNow(-30 + i),
      status: 'CONVERTED',
      note: null,
      cancelReason: null,
      createdById: SEED_DEVELOPER_ID,
      createdAt: daysFromNow(-(60 - i)),
    });

    // Variety: 1-3 signed ACTIVE with schedule; 5 unsigned ACTIVE no schedule;
    // 6 signed ACTIVE no schedule; 7 CANCELLED.
    const isCancelled = i === 6;
    const isUnsignedNoSchedule = i === 4;
    const withSchedule = i <= 2; // contracts 1-3
    contractPlans.push({
      idx: i,
      unit,
      bookingId: convertedBookingId,
      number: `2026-${String(i + 1).padStart(4, '0')}`,
      buyerName,
      buyerPhone,
      status: isCancelled ? 'CANCELLED' : 'ACTIVE',
      signed: !isUnsignedNoSchedule,
      agreed: !isUnsignedNoSchedule,
      withSchedule,
    });
  }

  await prisma.booking.createMany({ data: bookings });

  // Contract counter must reflect the highest 2026 sequence we minted.
  await prisma.orgContractCounter.create({
    data: { orgId: SEED_ORG_ID, year: 2026, lastSeq: CONTRACT_COUNT },
  });

  for (const plan of contractPlans) {
    const contractId = `seed-contract-${plan.idx + 1}`;
    await prisma.contract.create({
      data: {
        id: contractId,
        number: plan.number,
        orgId: SEED_ORG_ID,
        unitId: plan.unit.id,
        bookingId: plan.bookingId,
        buyerName: plan.buyerName,
        buyerPhone: plan.buyerPhone,
        agreedAmount: plan.agreed ? plan.unit.priceSom : null,
        status: plan.status,
        signedAt: plan.signed ? daysFromNow(-(50 - plan.idx * 3)) : null,
        cancelReason: plan.status === 'CANCELLED' ? 'Xaridor kreditdan o‘tolmadi' : null,
        cancelledAt: plan.status === 'CANCELLED' ? daysFromNow(-10) : null,
      },
    });

    if (plan.withSchedule && plan.unit.priceSom !== null) {
      const total = plan.unit.priceSom;
      const downPayment = (total * 30n) / 100n;
      const financed = total - downPayment;
      const installmentCount = 12;
      const perInstallment = financed / BigInt(installmentCount);
      const remainder = financed - perInstallment * BigInt(installmentCount);
      const scheduleId = `seed-schedule-${plan.idx + 1}`;
      const startDate = monthsFromNow(-5);

      await prisma.paymentSchedule.create({
        data: {
          id: scheduleId,
          contractId,
          downPaymentSom: downPayment,
          installmentCount,
          installmentSom: perInstallment,
          startDate,
        },
      });

      const installments: {
        id: string;
        scheduleId: string;
        seq: number;
        dueDate: Date;
        amountSom: bigint;
        status: 'PENDING' | 'PAID';
        paidAt: Date | null;
      }[] = [];

      // seq 0 = down payment (PAID).
      installments.push({
        id: `${scheduleId}-i0`,
        scheduleId,
        seq: 0,
        dueDate: startDate,
        amountSom: downPayment,
        status: 'PAID',
        paidAt: startDate,
      });

      for (let seq = 1; seq <= installmentCount; seq++) {
        const isLast = seq === installmentCount;
        const amount = isLast ? perInstallment + remainder : perInstallment;
        const dueDate = monthsFromNow(-5 + seq);
        // First two monthly installments PAID; the rest PENDING. Because
        // startDate is 5 months ago, seq 3 (~2 months ago) is PENDING & overdue.
        const paid = seq <= 2;
        installments.push({
          id: `${scheduleId}-i${seq}`,
          scheduleId,
          seq,
          dueDate,
          amountSom: amount,
          status: paid ? 'PAID' : 'PENDING',
          paidAt: paid ? dueDate : null,
        });
      }

      await prisma.paymentInstallment.createMany({ data: installments });
    }
  }

  // --- Org wallet + ledger ----------------------------------------------
  // TOPUP 900k in, COMMISSION_DEBIT 1.35M out, COMMISSION_REFUND 150k back =>
  // balance -300k (negative -> the cabinet shows "Qarz").
  await prisma.orgWallet.create({
    data: { id: 'seed-orgwallet-1', orgId: SEED_ORG_ID, balanceSom: -300_000n },
  });
  await prisma.orgWalletTransaction.createMany({
    data: [
      {
        id: 'seed-owtx-1',
        orgWalletId: 'seed-orgwallet-1',
        type: 'TOPUP',
        amountSom: 100_000n,
        createdAt: daysFromNow(-30),
      },
      {
        id: 'seed-owtx-2',
        orgWalletId: 'seed-orgwallet-1',
        type: 'TOPUP',
        amountSom: 300_000n,
        createdAt: daysFromNow(-25),
      },
      {
        id: 'seed-owtx-3',
        orgWalletId: 'seed-orgwallet-1',
        type: 'TOPUP',
        amountSom: 500_000n,
        createdAt: daysFromNow(-20),
      },
      {
        id: 'seed-owtx-4',
        orgWalletId: 'seed-orgwallet-1',
        type: 'COMMISSION_DEBIT',
        amountSom: 400_000n,
        fixationId: 'seed-fixation-ref-1',
        createdAt: daysFromNow(-15),
      },
      {
        id: 'seed-owtx-5',
        orgWalletId: 'seed-orgwallet-1',
        type: 'COMMISSION_DEBIT',
        amountSom: 600_000n,
        fixationId: 'seed-fixation-ref-2',
        createdAt: daysFromNow(-10),
      },
      {
        id: 'seed-owtx-6',
        orgWalletId: 'seed-orgwallet-1',
        type: 'COMMISSION_DEBIT',
        amountSom: 350_000n,
        fixationId: 'seed-fixation-ref-3',
        createdAt: daysFromNow(-6),
      },
      {
        id: 'seed-owtx-7',
        orgWalletId: 'seed-orgwallet-1',
        type: 'COMMISSION_REFUND',
        amountSom: 150_000n,
        fixationId: 'seed-fixation-ref-2',
        createdAt: daysFromNow(-3),
      },
    ],
  });

  console.log(
    `CRM seed: 1 org, ${COMPLEXES.length} complexes, ${allBuildings.length} buildings, ` +
      `${allUnits.length} units, ${bookings.length} bookings, ${contractPlans.length} contracts, ` +
      `1 wallet + 7 ledger rows.`,
  );
}
