import type { AiSearchCriteria, Deal, ListingSummary, ListingType } from '@rieltor/shared';

/** "ALL" — every type; the rest are the listing types themselves. */
export type TypeFilter = ListingType | 'ALL';

export type Sort = 'NEW' | 'CHEAP' | 'EXPENSIVE';

/** Kept short so the "Saralash: …" pill stays on a single line. */
export const SORT_LABELS: Record<Sort, string> = {
  NEW: 'Yangi',
  CHEAP: 'Arzon',
  EXPENSIVE: 'Qimmat',
};

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

/** Merge a partial AI criteria (the /api/ai/search-parse DTO) into a full Criteria
 *  (manual-search-equivalent). Called by the search page when seeded from AI navigation state. */
export function aiCriteriaToCriteria(ai: AiSearchCriteria): Criteria {
  return {
    ...EMPTY_CRITERIA,
    deal: ai.deal ?? EMPTY_CRITERIA.deal,
    type: ai.type ?? EMPTY_CRITERIA.type,
    sort: ai.sort ?? EMPTY_CRITERIA.sort,
    search: ai.search ?? EMPTY_CRITERIA.search,
    rooms: ai.rooms ?? null,
    priceMin: ai.priceMin ?? null,
    priceMax: ai.priceMax ?? null,
    areaMin: ai.areaMin ?? null,
    areaMax: ai.areaMax ?? null,
  };
}

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

function compare(a: ListingSummary, b: ListingSummary, sort: Sort) {
  // Prices fit in a Number (the priciest house is ~2.1 bn), but the source of truth
  // is a string, so BigInt comparison avoids any precision question.
  if (sort === 'CHEAP') return BigInt(a.priceSom) < BigInt(b.priceSom) ? -1 : 1;
  if (sort === 'EXPENSIVE') return BigInt(a.priceSom) > BigInt(b.priceSom) ? -1 : 1;
  return b.listedAt.localeCompare(a.listedAt);
}

/**
 * The single source of filtering — both the home list and the search page's
 * "Natijalarni ko'rsatish · N ta" counter call this, so the two can never
 * disagree about how many listings match.
 */
export function filterListings(
  listings: ListingSummary[] | undefined,
  c: Criteria,
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
    .sort((a, b) => compare(a, b, c.sort));
}
