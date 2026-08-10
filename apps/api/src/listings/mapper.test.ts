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
  deal: 'SALE' as const,
  views: 3,
  listedAt: new Date('2026-07-22T00:00:00.000Z'),
  lat: 41.31,
  lng: 69.24,
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

describe('toListingDetail', () => {
  it('converts priceSom to a string', () => {
    expect(toListingDetail(row).priceSom).toBe('480000000');
  });

  it('returns the date as YYYY-MM-DD', () => {
    expect(toListingDetail(row).listedAt).toBe('2026-07-22');
  });

  it('the result passes ListingDetailSchema', () => {
    expect(() => ListingDetailSchema.parse(toListingDetail(row))).not.toThrow();
  });

  it('omits agentId from the response', () => {
    expect(toListingDetail(row)).not.toHaveProperty('agentId');
  });
});

describe('toListingSummary', () => {
  it('returns only the first image', () => {
    expect(toListingSummary(row).image?.base).toBe('/images/bx-002/01');
  });

  it('returns null when there is no image', () => {
    expect(toListingSummary({ ...row, images: [] }).image).toBeNull();
  });

  it('drops heavy fields such as the description', () => {
    expect(toListingSummary(row)).not.toHaveProperty('description');
  });
});
