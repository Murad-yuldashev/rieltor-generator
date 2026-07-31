import { describe, expect, it } from 'vitest';
import { ListingDetailSchema } from '@rieltor/shared';
import { toListingDetail, toListingSummary } from './mapper';

const row = {
  id: 'bx-002',
  title: 'Test',
  priceSom: 480000000n,
  priceUsd: 40000,
  rooms: 2,
  areaM2: 58,
  floor: '4/5',
  district: 'Buxoro shahri',
  address: 'Manzil',
  landmark: 'Moljal',
  description: 'Tavsif',
  type: 'SECONDARY' as const,
  views: 3,
  listedAt: new Date('2026-07-22T00:00:00.000Z'),
  agentId: 'agent-1',
  agent: {
    id: 'agent-1',
    name: 'Rieltor',
    agency: 'Agentlik',
    photoUrl: '/images/agents/agent-1.jpg',
    phone: '+998901234567',
    telegram: 'username',
  },
  images: [
    {
      base: '/images/bx-002/01',
      ogUrl: '/images/bx-002/og.jpg',
      width: 1200,
      height: 900,
      position: 1,
    },
    { base: '/images/bx-002/02', ogUrl: null, width: 1200, height: 900, position: 2 },
  ],
};

describe('detailgaAylantir', () => {
  it('narxSom ni satrga aylantiradi', () => {
    expect(toListingDetail(row).priceSom).toBe('480000000');
  });

  it("sana ni YYYY-MM-DD ko'rinishida beradi", () => {
    expect(toListingDetail(row).listedAt).toBe('2026-07-22');
  });

  it("natija ObjectDetailSchema dan o'tadi", () => {
    expect(() => ListingDetailSchema.parse(toListingDetail(row))).not.toThrow();
  });

  it("agentId ni javobga qo'shmaydi", () => {
    expect(toListingDetail(row)).not.toHaveProperty('agentId');
  });
});

describe('royxatgaAylantir', () => {
  it('faqat birinchi rasmni beradi', () => {
    expect(toListingSummary(row).image?.base).toBe('/images/bx-002/01');
  });

  it("rasm bo'lmasa null qaytaradi", () => {
    expect(toListingSummary({ ...row, images: [] }).image).toBeNull();
  });

  it("tavsif kabi og'ir maydonlarni tashlab ketadi", () => {
    expect(toListingSummary(row)).not.toHaveProperty('description');
  });
});
