import { describe, expect, it } from 'vitest';
import { ListingDetailSchema, ViewsSchema } from './schemas';

const fullListing = {
  id: 'bx-001',
  title: "2 xonali kvartira, yangi ta'mir",
  priceSom: '480000000',
  priceUsd: 40000,
  rooms: 2,
  areaM2: 60,
  floor: '4/9',
  district: 'Buxoro shahri',
  address: "Navoiy ko'chasi 12",
  landmark: 'Bukhara City yaqinida',
  description: 'Uch jumlalik tavsif.',
  type: 'SECONDARY',
  views: 7,
  listedAt: '2026-07-28',
  images: [
    {
      base: '/images/bx-001/01',
      ogUrl: '/images/bx-001/og.jpg',
      width: 1200,
      height: 900,
      position: 1,
    },
  ],
  agent: {
    id: 'ag-1',
    name: 'Murod',
    agency: 'Buxoro Uy',
    photoUrl: '/images/agents/ag-1.jpg',
    phone: '+998901234567',
    telegram: 'murod',
  },
};

describe('ObjectDetailSchema', () => {
  it("to'liq obyektni qabul qiladi", () => {
    expect(ListingDetailSchema.parse(fullListing).id).toBe('bx-001');
  });

  it("hovli uchun qavat null bo'lishiga ruxsat beradi", () => {
    const houseListing = { ...fullListing, type: 'HOUSE', floor: null };
    expect(ListingDetailSchema.parse(houseListing).floor).toBeNull();
  });

  it("narxSom number bo'lsa rad etadi", () => {
    expect(() => ListingDetailSchema.parse({ ...fullListing, priceSom: 480000000 })).toThrow();
  });

  it('notanish turi qiymatini rad etadi', () => {
    expect(() => ListingDetailSchema.parse({ ...fullListing, type: 'DACHA' })).toThrow();
  });
});

describe('ViewsSchema', () => {
  it('butun son talab qiladi', () => {
    expect(ViewsSchema.parse({ views: 12 }).views).toBe(12);
    expect(() => ViewsSchema.parse({ views: 1.5 })).toThrow();
  });
});
