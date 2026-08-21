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
  deal: 'SALE',
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
    phoneMasked: '+99890 ••• •• 67',
    telegram: 'murod',
  },
};

describe('ListingDetailSchema', () => {
  it('accepts a complete listing', () => {
    expect(ListingDetailSchema.parse(fullListing).id).toBe('bx-001');
  });

  it('allows a null floor for a house', () => {
    const houseListing = { ...fullListing, type: 'HOUSE', floor: null };
    expect(ListingDetailSchema.parse(houseListing).floor).toBeNull();
  });

  it('rejects a numeric priceSom', () => {
    expect(() => ListingDetailSchema.parse({ ...fullListing, priceSom: 480000000 })).toThrow();
  });

  it('allows a null rooms count for a commercial premise', () => {
    const commercial = { ...fullListing, type: 'COMMERCIAL', rooms: null };
    expect(ListingDetailSchema.parse(commercial).rooms).toBeNull();
  });

  it('rejects an unknown type value', () => {
    expect(() => ListingDetailSchema.parse({ ...fullListing, type: 'DACHA' })).toThrow();
  });

  it('rejects an unknown deal value', () => {
    expect(() => ListingDetailSchema.parse({ ...fullListing, deal: 'SWAP' })).toThrow();
  });
});

describe('ViewsSchema', () => {
  it('requires an integer', () => {
    expect(ViewsSchema.parse({ views: 12 }).views).toBe(12);
    expect(() => ViewsSchema.parse({ views: 1.5 })).toThrow();
  });
});
