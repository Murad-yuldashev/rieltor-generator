export interface Point {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine great-circle distance. Accurate to well under a metre at city scale. */
export function distanceKm(a: Point, b: Point): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Under a kilometre reads better in metres, rounded to the nearest ten. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round((km * 1000) / 10) * 10} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * District centres, good enough to name the district a point falls in. Kept here
 * rather than fetched from a geocoder: one table, no API key, no quota, and it
 * works offline — the only thing the label is used for is a header chip.
 *
 * Approximate to a few hundred metres, which is far below the distance between
 * any two district centres.
 */
export const TASHKENT_DISTRICTS = [
  { name: 'Bektemir tumani', lat: 41.21, lng: 69.34 },
  { name: 'Chilonzor tumani', lat: 41.275, lng: 69.205 },
  { name: 'Mirobod tumani', lat: 41.29, lng: 69.29 },
  { name: "Mirzo Ulug'bek tumani", lat: 41.325, lng: 69.34 },
  { name: 'Olmazor tumani', lat: 41.35, lng: 69.22 },
  { name: 'Sergeli tumani', lat: 41.22, lng: 69.22 },
  { name: 'Shayxontohur tumani', lat: 41.32, lng: 69.23 },
  { name: 'Uchtepa tumani', lat: 41.3, lng: 69.18 },
  { name: 'Yakkasaroy tumani', lat: 41.283, lng: 69.25 },
  { name: 'Yangihayot tumani', lat: 41.205, lng: 69.25 },
  { name: 'Yashnobod tumani', lat: 41.283, lng: 69.345 },
  { name: 'Yunusobod tumani', lat: 41.3675, lng: 69.2894 },
] as const;

/** Nearest district centre by straight-line distance. Never returns null. */
export function nearestDistrict(point: Point): string {
  let best: (typeof TASHKENT_DISTRICTS)[number] = TASHKENT_DISTRICTS[0];
  let bestKm = Infinity;

  for (const district of TASHKENT_DISTRICTS) {
    const km = distanceKm(point, district);
    if (km < bestKm) {
      bestKm = km;
      best = district;
    }
  }

  return best.name;
}
