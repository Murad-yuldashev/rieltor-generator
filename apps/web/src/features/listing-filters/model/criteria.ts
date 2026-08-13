import type { Deal, ListingSummary, ListingType } from '@rieltor/shared';
import { distanceKm, type Point } from '@rieltor/shared';

/** "ALL" — every type; the rest are the listing types themselves. */
export type TypeFilter = ListingType | 'ALL';

export type Sort = 'NEW' | 'CHEAP' | 'EXPENSIVE' | 'NEAR';

/** Display order for the sort pill's options — labels come from the `feed` i18n bundle. */
export const SORT_OPTIONS: Sort[] = ['NEW', 'CHEAP', 'EXPENSIVE', 'NEAR'];

/** The largest rooms bucket is "5+" — anything above it falls into the same bucket. */
export const MAX_ROOMS_BUCKET = 5;

export interface Criteria {
  deal: Deal;
  type: TypeFilter;
  sort: Sort;
  search: string;
  /** MAX_ROOMS_BUCKET means "that many or more". */
  rooms: number | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
}

export const EMPTY_CRITERIA: Criteria = {
  deal: 'SALE',
  type: 'ALL',
  sort: 'NEW',
  search: '',
  rooms: null,
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
};

/** Is anything from the "Filtrlar" panel active, beyond the search box and chips? */
export function hasAdvancedFilters(c: Criteria) {
  return (
    c.rooms !== null ||
    c.priceMin !== null ||
    c.priceMax !== null ||
    c.areaMin !== null ||
    c.areaMax !== null
  );
}

function matchesSearch(listing: ListingSummary, query: string) {
  // The list response carries no address — title, district and landmark are enough.
  const haystack = `${listing.title} ${listing.district} ${listing.landmark}`.toLowerCase();
  return haystack.includes(query);
}

function matchesRooms(listing: ListingSummary, rooms: number | null) {
  if (rooms === null) return true;
  // Commercial premises carry no room count, so a room filter excludes them.
  if (listing.rooms === null) return false;
  return rooms >= MAX_ROOMS_BUCKET ? listing.rooms >= rooms : listing.rooms === rooms;
}

function inRange(value: number, min: number | null, max: number | null) {
  return (min === null || value >= min) && (max === null || value <= max);
}

function compare(a: ListingSummary, b: ListingSummary, sort: Sort, origin: Point | null) {
  // Prices fit in a Number (the priciest house is ~2.1 bn), but the source of truth
  // is a string, so BigInt comparison avoids any precision question.
  if (sort === 'CHEAP') return BigInt(a.priceSom) < BigInt(b.priceSom) ? -1 : 1;
  if (sort === 'EXPENSIVE') return BigInt(a.priceSom) > BigInt(b.priceSom) ? -1 : 1;
  if (sort === 'NEAR' && origin) {
    // A listing without a pin cannot be ranked by distance, so it sinks to the end
    // rather than pretending to be at the origin.
    const aKm = listingDistance(a, origin);
    const bKm = listingDistance(b, origin);
    // Two unpinned listings are both Infinity, and Infinity - Infinity is NaN — a
    // comparator returning NaN leaves the order undefined. An exact tie (including
    // that one) falls back to the newest-first rule.
    if (aKm === bKm) return b.listedAt.localeCompare(a.listedAt);
    return aKm - bKm;
  }
  return b.listedAt.localeCompare(a.listedAt);
}

/** Infinity for an unpinned listing — forces it to sort after any pinned listing. */
function listingDistance(listing: ListingSummary, origin: Point): number {
  if (listing.lat === null || listing.lng === null) return Infinity;
  return distanceKm(origin, { lat: listing.lat, lng: listing.lng });
}

/**
 * The single source of filtering — both the home list and the search page's
 * "Natijalarni ko'rsatish · N ta" counter call this, so the two can never
 * disagree about how many listings match.
 */
export function filterListings(
  listings: ListingSummary[] | undefined,
  c: Criteria,
  origin: Point | null = null,
): ListingSummary[] {
  if (!listings) return [];

  const query = c.search.trim().toLowerCase();

  return listings
    .filter(
      (l) =>
        l.deal === c.deal &&
        (c.type === 'ALL' || l.type === c.type) &&
        (!query || matchesSearch(l, query)) &&
        matchesRooms(l, c.rooms) &&
        inRange(Number(l.priceSom), c.priceMin, c.priceMax) &&
        inRange(l.areaM2, c.areaMin, c.areaMax),
    )
    .sort((a, b) => compare(a, b, c.sort, origin));
}
