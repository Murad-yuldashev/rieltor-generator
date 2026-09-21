import type { PrismaClient } from '@prisma/client';

/** Fixed phone (E.164 without the plus) of the seed REALTOR. Log in with this
 *  (devCode OTP in non-prod) to land in the populated agent cabinet. */
export const SEED_REALTOR_PHONE = '998900000003';
const SEED_REALTOR_ID = 'seed-realtor-1';

const now = new Date();
function daysFromNow(days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

// Deterministic CRM unit ids minted by seedDeveloperCrm; each unit's
// building.complexId MUST equal its fixated lead's complexId.
const CX1_UNIT = 'seed-unit-cx1-A-1-1'; // building seed-bld-cx1-A -> complex seed-cx-1
const CX2_UNIT = 'seed-unit-cx2-A-1-1'; // building seed-bld-cx2-A -> complex seed-cx-2

/** Seed a complete realtor cabinet. Guarded on Subscription count (this seed
 *  mints the only Subscription rows). MUST run AFTER seedDeveloperCrm(prisma). */
export async function seedRealtorCabinet(prisma: PrismaClient): Promise<void> {
  if ((await prisma.subscription.count()) > 0) {
    console.log('Realtor seed: obuna allaqachon mavjud, o‘tkazib yuborildi.');
    return;
  }

  await prisma.user.create({
    data: { id: SEED_REALTOR_ID, phone: SEED_REALTOR_PHONE, name: 'Aziz Rieltor', role: 'REALTOR' },
  });
  await prisma.user.createMany({
    data: [
      { id: 'seed-buyer-1', phone: '998905000001', name: 'Aziza Karimova' },
      { id: 'seed-buyer-2', phone: '998905000002', name: 'Bobur Aliyev' },
      { id: 'seed-buyer-3', phone: '998905000003', name: 'Dilnoza Yusupova' },
      { id: 'seed-buyer-4', phone: '998905000004', name: 'Sardor Rahimov' },
      { id: 'seed-buyer-5', phone: '998905000005', name: 'Malika Tosheva' },
      { id: 'seed-buyer-6', phone: '998905000006', name: 'Jasur Ismoilov' },
    ],
  });

  await prisma.realtorProfile.create({
    data: {
      id: 'seed-realtor-profile-1',
      userId: SEED_REALTOR_ID,
      agency: 'Toshkent Uy Savdo',
      slug: 'aziz-rieltor',
      verified: true,
      regions: ['Toshkent shahri'],
      experienceYears: 6,
      bio: 'Yangi qurilish va ikkilamchi bozor bo‘yicha 6 yillik tajriba.',
      ratingSum: 14,
      ratingCount: 3, // == 5 + 4 + 5 (the APPROVED reviews)
    },
  });

  await prisma.subscription.create({
    data: {
      id: 'seed-sub-1',
      userId: SEED_REALTOR_ID,
      status: 'ACTIVE',
      tier: 'PRO',
      currentPeriodEnd: daysFromNow(30),
    },
  });

  // 10 claimed leads: NEWx2 CONTACTEDx2 MEETINGx2 WONx2 LOSTx2 -> winRate 0.5.
  // 2 NEW_BUILD leads (won-1, contacted-2) carry complexId+unitId for the fixation chain.
  await prisma.propertyRequest.createMany({
    data: [
      {
        id: 'seed-lead-won-1',
        authorId: 'seed-buyer-4',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-12),
        deal: 'SALE',
        type: 'NEW_BUILD',
        district: 'Yunusobod tumani',
        status: 'CLAIMED',
        outcomeStage: 'WON',
        score: 95,
        priceSom: 120_000n,
        priceMaxSom: 900_000_000n,
        complexId: 'seed-cx-1',
        unitId: CX1_UNIT,
      },
      {
        id: 'seed-lead-won-2',
        authorId: 'seed-buyer-5',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-18),
        deal: 'SALE',
        type: 'SECONDARY',
        district: 'Mirzo Ulug‘bek tumani',
        status: 'CLAIMED',
        outcomeStage: 'WON',
        score: 88,
        priceSom: 70_000n,
        priceMaxSom: 700_000_000n,
      },
      {
        id: 'seed-lead-contacted-2',
        authorId: 'seed-buyer-2',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-4),
        deal: 'SALE',
        type: 'NEW_BUILD',
        district: 'Chilonzor tumani',
        status: 'CLAIMED',
        outcomeStage: 'CONTACTED',
        score: 75,
        priceSom: 85_000n,
        priceMaxSom: 800_000_000n,
        complexId: 'seed-cx-2',
        unitId: CX2_UNIT,
      },
      {
        id: 'seed-lead-contacted-1',
        authorId: 'seed-buyer-1',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-6),
        deal: 'RENT',
        type: 'SECONDARY',
        district: 'Yakkasaroy tumani',
        status: 'CLAIMED',
        outcomeStage: 'CONTACTED',
        score: 62,
        priceSom: 80_000n,
      },
      {
        id: 'seed-lead-meeting-1',
        authorId: 'seed-buyer-3',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-8),
        deal: 'SALE',
        type: 'SECONDARY',
        district: 'Yunusobod tumani',
        status: 'CLAIMED',
        outcomeStage: 'MEETING',
        score: 84,
        priceSom: 90_000n,
        priceMaxSom: 650_000_000n,
      },
      {
        id: 'seed-lead-meeting-2',
        authorId: 'seed-buyer-5',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-3),
        deal: 'RENT',
        type: 'SECONDARY',
        district: 'Chilonzor tumani',
        status: 'CLAIMED',
        outcomeStage: 'MEETING',
        score: 70,
        priceSom: 75_000n,
      },
      {
        id: 'seed-lead-new-1',
        authorId: 'seed-buyer-1',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-1),
        deal: 'SALE',
        type: 'SECONDARY',
        district: 'Sergeli tumani',
        status: 'CLAIMED',
        outcomeStage: 'NEW',
        score: 90,
        priceSom: 90_000n,
      },
      {
        id: 'seed-lead-new-2',
        authorId: 'seed-buyer-3',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-2),
        deal: 'SALE',
        type: 'SECONDARY',
        district: 'Olmazor tumani',
        status: 'CLAIMED',
        outcomeStage: 'NEW',
        score: 66,
        priceSom: 60_000n,
      },
      {
        id: 'seed-lead-lost-1',
        authorId: 'seed-buyer-6',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-20),
        deal: 'RENT',
        type: 'SECONDARY',
        district: 'Uchtepa tumani',
        status: 'CLAIMED',
        outcomeStage: 'LOST',
        lostReason: 'NO_RESPONSE',
        score: 40,
        priceSom: 100_000n,
      },
      {
        id: 'seed-lead-lost-2',
        authorId: 'seed-buyer-6',
        claimedById: SEED_REALTOR_ID,
        claimedAt: daysFromNow(-25),
        deal: 'SALE',
        type: 'SECONDARY',
        district: 'Bektemir tumani',
        status: 'CLAIMED',
        outcomeStage: 'LOST',
        lostReason: 'BOUGHT_ELSEWHERE',
        score: 55,
        priceSom: 60_000n,
      },
    ],
  });

  await prisma.fixation.createMany({
    data: [
      {
        id: 'seed-fixation-1',
        realtorId: SEED_REALTOR_ID,
        unitId: CX2_UNIT,
        propertyRequestId: 'seed-lead-contacted-2',
        buyerPhone: '998905000002',
        status: 'ACTIVE',
        commissionBps: 150,
        commissionSom: null,
      },
      {
        id: 'seed-fixation-2',
        realtorId: SEED_REALTOR_ID,
        unitId: CX1_UNIT,
        propertyRequestId: 'seed-lead-won-1',
        buyerPhone: '998905000004',
        status: 'CONVERTED',
        commissionBps: 200,
        commissionSom: 250_000n,
        convertedAt: daysFromNow(-10),
      },
    ],
  });

  await prisma.wallet.create({
    data: { id: 'seed-rwallet-1', userId: SEED_REALTOR_ID, balanceSom: -150_000n },
  });
  await prisma.walletTransaction.createMany({
    data: [
      {
        id: 'seed-rtx-1',
        walletId: 'seed-rwallet-1',
        type: 'TOPUP',
        amountSom: 200_000n,
        createdAt: daysFromNow(-30),
      },
      {
        id: 'seed-rtx-2',
        walletId: 'seed-rwallet-1',
        type: 'TOPUP',
        amountSom: 100_000n,
        createdAt: daysFromNow(-28),
      },
      {
        id: 'seed-rtx-3',
        walletId: 'seed-rwallet-1',
        type: 'COMMISSION',
        amountSom: 250_000n,
        fixationId: 'seed-fixation-2',
        createdAt: daysFromNow(-10),
      },
      {
        id: 'seed-rtx-4',
        walletId: 'seed-rwallet-1',
        type: 'LEAD_CLAIM',
        amountSom: 120_000n,
        leadId: 'seed-lead-won-1',
        createdAt: daysFromNow(-12),
      },
      {
        id: 'seed-rtx-5',
        walletId: 'seed-rwallet-1',
        type: 'LEAD_CLAIM',
        amountSom: 70_000n,
        leadId: 'seed-lead-won-2',
        createdAt: daysFromNow(-18),
      },
      {
        id: 'seed-rtx-6',
        walletId: 'seed-rwallet-1',
        type: 'LEAD_CLAIM',
        amountSom: 90_000n,
        leadId: 'seed-lead-meeting-1',
        createdAt: daysFromNow(-8),
      },
      {
        id: 'seed-rtx-7',
        walletId: 'seed-rwallet-1',
        type: 'LEAD_CLAIM',
        amountSom: 80_000n,
        leadId: 'seed-lead-contacted-1',
        createdAt: daysFromNow(-6),
      },
      {
        id: 'seed-rtx-8',
        walletId: 'seed-rwallet-1',
        type: 'LEAD_CLAIM',
        amountSom: 90_000n,
        leadId: 'seed-lead-new-1',
        createdAt: daysFromNow(-1),
      },
      {
        id: 'seed-rtx-9',
        walletId: 'seed-rwallet-1',
        type: 'LEAD_CLAIM',
        amountSom: 100_000n,
        leadId: 'seed-lead-lost-1',
        createdAt: daysFromNow(-20),
      },
      {
        id: 'seed-rtx-10',
        walletId: 'seed-rwallet-1',
        type: 'COMMISSION_CLAWBACK',
        amountSom: 150_000n,
        fixationId: 'seed-fixation-2',
        createdAt: daysFromNow(-5),
      },
      // Each LEAD_CLAIM amountSom equals its lead's priceSom (the real claim flow debits lead.priceSom).
      // signed: (200+100+250) - (120+70+90+80+90+100 + 150) = 550 - 700 = -150 (thousands) == balanceSom -150_000n
    ],
  });

  await prisma.collection.createMany({
    data: [
      {
        id: 'seed-coll-1',
        realtorId: SEED_REALTOR_ID,
        name: 'Yunusobod tanlovi',
        createdAt: daysFromNow(-14),
        updatedAt: daysFromNow(-2),
      },
      {
        id: 'seed-coll-2',
        realtorId: SEED_REALTOR_ID,
        name: 'Ijara variantlari',
        createdAt: daysFromNow(-9),
        updatedAt: daysFromNow(-5),
      },
      {
        id: 'seed-coll-3',
        realtorId: SEED_REALTOR_ID,
        name: 'Yangi tanlov',
        createdAt: daysFromNow(-1),
        updatedAt: daysFromNow(-1),
      }, // empty -> "Bo'sh"
    ],
  });
  await prisma.collectionItem.createMany({
    data: [
      { id: 'seed-ci-1', collectionId: 'seed-coll-1', listingId: 'bx-001', position: 1 },
      { id: 'seed-ci-2', collectionId: 'seed-coll-1', listingId: 'bx-005', position: 2 },
      { id: 'seed-ci-3', collectionId: 'seed-coll-1', listingId: 'bx-008', position: 3 },
      { id: 'seed-ci-4', collectionId: 'seed-coll-1', listingId: 'bx-010', position: 4 },
      { id: 'seed-ci-5', collectionId: 'seed-coll-2', listingId: 'bx-011', position: 1 },
      { id: 'seed-ci-6', collectionId: 'seed-coll-2', listingId: 'bx-012', position: 2 },
      { id: 'seed-ci-7', collectionId: 'seed-coll-2', listingId: 'bx-013', position: 3 },
      { id: 'seed-ci-8', collectionId: 'seed-coll-2', listingId: 'bx-014', position: 4 },
      { id: 'seed-ci-9', collectionId: 'seed-coll-2', listingId: 'bx-015', position: 5 },
    ],
  });

  await prisma.presentation.create({
    data: {
      id: 'seed-pres-1',
      realtorId: SEED_REALTOR_ID,
      token: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      title: 'Aziza uchun tanlov',
      clientLabel: 'Aziza Karimova',
      sourceCollectionId: 'seed-coll-1',
      items: {
        create: [
          { id: 'seed-pi-1', listingId: 'bx-001', position: 1 },
          { id: 'seed-pi-2', listingId: 'bx-005', position: 2 },
          { id: 'seed-pi-3', listingId: 'bx-008', position: 3 },
        ],
      },
    },
  });
  await prisma.presentation.create({
    data: {
      id: 'seed-pres-2',
      realtorId: SEED_REALTOR_ID,
      token: 'f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5',
      title: 'Bobur uchun ijara',
      clientLabel: 'Bobur Aliyev',
      sourceCollectionId: 'seed-coll-2',
      items: {
        create: [
          { id: 'seed-pi-4', listingId: 'bx-011', position: 1 },
          { id: 'seed-pi-5', listingId: 'bx-012', position: 2 },
          { id: 'seed-pi-6', listingId: 'bx-013', position: 3 },
        ],
      },
    },
  });
  await prisma.presentationView.createMany({
    data: [
      // 8 open events (listingId null) for pres-1 -> opensCount 8
      { id: 'seed-pv-1', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-6) },
      { id: 'seed-pv-2', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-6) },
      { id: 'seed-pv-3', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-5) },
      { id: 'seed-pv-4', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-5) },
      { id: 'seed-pv-5', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-4) },
      { id: 'seed-pv-6', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-4) },
      { id: 'seed-pv-7', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-3) },
      { id: 'seed-pv-8', presentationId: 'seed-pres-1', listingId: null, at: daysFromNow(-2) },
      // per-listing dwell rows (listingId set) -> feed per-item opens/avg, NOT opensCount
      {
        id: 'seed-pv-9',
        presentationId: 'seed-pres-1',
        listingId: 'bx-001',
        durationMs: 42_000,
        at: daysFromNow(-5),
      },
      {
        id: 'seed-pv-10',
        presentationId: 'seed-pres-1',
        listingId: 'bx-001',
        durationMs: 38_000,
        at: daysFromNow(-4),
      },
      {
        id: 'seed-pv-11',
        presentationId: 'seed-pres-1',
        listingId: 'bx-005',
        durationMs: 25_000,
        at: daysFromNow(-4),
      },
      {
        id: 'seed-pv-12',
        presentationId: 'seed-pres-1',
        listingId: 'bx-008',
        durationMs: 15_000,
        at: daysFromNow(-3),
      },
      // pres-2: NO null-listingId rows -> opensCount 0 (drives "Ochilmagan" tile)
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        id: 'seed-note-1',
        realtorId: SEED_REALTOR_ID,
        listingId: 'bx-001',
        body: 'Mijoz 7-qavatni yoqtirdi. Narx bo‘yicha kelishish mumkin.',
        createdAt: daysFromNow(-6),
        updatedAt: daysFromNow(-1),
      },
      {
        id: 'seed-note-2',
        realtorId: SEED_REALTOR_ID,
        listingId: 'bx-002',
        body: 'Egasi tez sotmoqchi — chegirma bor.',
        createdAt: daysFromNow(-5),
        updatedAt: daysFromNow(-3),
      },
      {
        id: 'seed-note-3',
        realtorId: SEED_REALTOR_ID,
        listingId: 'bx-005',
        body: 'Hovli tomon deraza. Yaxshi variant.',
        createdAt: daysFromNow(-4),
        updatedAt: daysFromNow(-4),
      },
      {
        id: 'seed-note-4',
        realtorId: SEED_REALTOR_ID,
        listingId: 'bx-011',
        body: 'Ijaraga: kelishuv 6 oyga.',
        createdAt: daysFromNow(-3),
        updatedAt: daysFromNow(-2),
      },
      {
        id: 'seed-note-5',
        realtorId: SEED_REALTOR_ID,
        listingId: 'bx-012',
        body: 'Mebel bilan. Mijozga ko‘rsatildi.',
        createdAt: daysFromNow(-2),
        updatedAt: daysFromNow(-2),
      },
    ],
  });

  await prisma.review.createMany({
    data: [
      {
        id: 'seed-review-1',
        realtorId: SEED_REALTOR_ID,
        authorId: 'seed-buyer-1',
        rating: 5,
        comment: 'Juda professional, tavsiya qilaman.',
        status: 'APPROVED',
      },
      {
        id: 'seed-review-2',
        realtorId: SEED_REALTOR_ID,
        authorId: 'seed-buyer-2',
        rating: 4,
        comment: 'Tez javob berdi.',
        status: 'APPROVED',
      },
      {
        id: 'seed-review-3',
        realtorId: SEED_REALTOR_ID,
        authorId: 'seed-buyer-3',
        rating: 5,
        comment: 'Kerakli variantni topib berdi.',
        status: 'APPROVED',
      },
    ],
  });

  console.log(
    'Realtor seed: 1 rieltor + 6 xaridor, 1 obuna, 10 lead, 2 fiksatsiya, hamyon + 10 tranzaksiya, 3 kolleksiya/9 element, 2 taqdimot/6 element, 5 eslatma, 3 sharh.',
  );
}
