import { describe, expect, it } from 'vitest';
import type { ListingSummary } from '@rieltor/shared';
import { EMPTY_CRITERIA, filterListings } from './criteria';

function listing(id: string, lat: number | null, lng: number | null): ListingSummary {
  return {
    id,
    title: `Obyekt ${id}`,
    priceSom: '100000000',
    priceUsd: 8000,
    rooms: 2,
    areaM2: 50,
    floor: '2/9',
    district: 'Chilonzor tumani',
    landmark: 'Metro yaqinida',
    type: 'SECONDARY',
    deal: 'SALE',
    listedAt: '2026-08-01',
    lat,
    lng,
    image: null,
    imageCount: 0,
    priceDropped: false,
  };
}

const ORIGIN = { lat: 41.3, lng: 69.24 };

describe('filterListings with NEAR', () => {
  it('puts the closest listing first', () => {
    const far = listing('far', 41.22, 69.22);
    const near = listing('near', 41.301, 69.241);

    const result = filterListings([far, near], { ...EMPTY_CRITERIA, sort: 'NEAR' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['near', 'far']);
  });

  it('pushes listings without coordinates to the end', () => {
    const pinned = listing('pinned', 41.22, 69.22);
    const unpinned = listing('unpinned', null, null);

    const result = filterListings([unpinned, pinned], { ...EMPTY_CRITERIA, sort: 'NEAR' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['pinned', 'unpinned']);
  });

  it('keeps a deterministic order when neither listing has coordinates', () => {
    const older = { ...listing('older', null, null), listedAt: '2026-07-01' };
    const newer = { ...listing('newer', null, null), listedAt: '2026-08-05' };

    const result = filterListings([older, newer], { ...EMPTY_CRITERIA, sort: 'NEAR' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['newer', 'older']);
  });

  it('falls back to the newest-first order when the origin is unknown', () => {
    const older = { ...listing('older', 41.301, 69.241), listedAt: '2026-07-01' };
    const newer = { ...listing('newer', 41.22, 69.22), listedAt: '2026-08-05' };

    const result = filterListings([older, newer], { ...EMPTY_CRITERIA, sort: 'NEAR' }, null);
    expect(result.map((l) => l.id)).toEqual(['newer', 'older']);
  });

  it('leaves the other sorts untouched', () => {
    const cheap = { ...listing('cheap', 41.22, 69.22), priceSom: '50000000' };
    const pricey = { ...listing('pricey', 41.301, 69.241), priceSom: '900000000' };

    const result = filterListings([pricey, cheap], { ...EMPTY_CRITERIA, sort: 'CHEAP' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['cheap', 'pricey']);
  });
});
