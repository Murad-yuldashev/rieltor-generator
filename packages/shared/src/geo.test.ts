import { describe, expect, it } from 'vitest';
import { TASHKENT_DISTRICTS, distanceKm, formatDistance, nearestDistrict } from './geo';

/** Two well-separated Tashkent points, ~13 km apart. */
const SERGELI = { lat: 41.22, lng: 69.22 };
const YUNUSOBOD = { lat: 41.3675, lng: 69.2894 };

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(SERGELI, SERGELI)).toBe(0);
  });

  it('measures a known Tashkent span within a tolerance', () => {
    const km = distanceKm(SERGELI, YUNUSOBOD);
    expect(km).toBeGreaterThan(16);
    expect(km).toBeLessThan(18);
  });

  it('is symmetric', () => {
    expect(distanceKm(SERGELI, YUNUSOBOD)).toBeCloseTo(distanceKm(YUNUSOBOD, SERGELI), 6);
  });

  it('measures one degree of latitude as about 111 km', () => {
    const km = distanceKm({ lat: 41, lng: 69 }, { lat: 42, lng: 69 });
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });
});

describe('formatDistance', () => {
  it.each([
    [0.12, '120 m'],
    [0.85, '850 m'],
    [0.999, '1000 m'],
    [1, '1.0 km'],
    [2.44, '2.4 km'],
    [12.06, '12.1 km'],
  ])('formats %s km as %s', (km, expected) => {
    expect(formatDistance(km)).toBe(expected);
  });
});

describe('TASHKENT_DISTRICTS', () => {
  it('covers all twelve districts with unique names', () => {
    expect(TASHKENT_DISTRICTS).toHaveLength(12);
    expect(new Set(TASHKENT_DISTRICTS.map((d) => d.name)).size).toBe(12);
  });

  it('places every district inside the Tashkent bounding box', () => {
    for (const d of TASHKENT_DISTRICTS) {
      expect(d.lat).toBeGreaterThan(41.15);
      expect(d.lat).toBeLessThan(41.42);
      expect(d.lng).toBeGreaterThan(69.1);
      expect(d.lng).toBeLessThan(69.45);
    }
  });
});

describe('nearestDistrict', () => {
  it('returns a district by its own centre', () => {
    for (const d of TASHKENT_DISTRICTS) {
      expect(nearestDistrict({ lat: d.lat, lng: d.lng })).toBe(d.name);
    }
  });

  it('still answers for a point far outside the city', () => {
    expect(TASHKENT_DISTRICTS.map((d) => d.name)).toContain(
      nearestDistrict({ lat: 39.65, lng: 66.96 }),
    );
  });
});
