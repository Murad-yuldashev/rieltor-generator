import type { Agent, Image, Listing, PriceHistory } from '@prisma/client';
import type { Image as ImageDto, ListingDetail, ListingSummary } from '@rieltor/shared';

/** How far back a price change still counts toward the "price dropped" flag (design spec §7.6). */
const PRICE_DROP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ListingRow = Listing & {
  agent: Agent;
  images: Pick<Image, keyof ImageDto>[];
  /** Pre-filtered to the last 7 days by listingInclude() — see hasPriceDropped(). */
  priceHistory: Pick<PriceHistory, 'priceSom'>[];
};

/**
 * The `include` every public/owner listing read uses to build a ListingRow —
 * co-located with the type it feeds so the two never drift apart. priceHistory is
 * windowed to the last 7 days here (a single indexed query via
 * @@index([listingId, changedAt])), not fetched in full, so a listing that has
 * changed price many times over its life does not cost the public read anything.
 */
export function listingInclude(now: Date = new Date()) {
  return {
    agent: true,
    images: { orderBy: { position: 'asc' } },
    priceHistory: {
      where: { changedAt: { gte: new Date(now.getTime() - PRICE_DROP_WINDOW_MS) } },
      select: { priceSom: true },
    },
  } as const;
}

/** @db.Date in the database, UTC midnight in JS — the first 10 ISO chars suffice. */
function dateText(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function imageDto(r: Pick<Image, keyof ImageDto>): ImageDto {
  return { base: r.base, ogUrl: r.ogUrl, width: r.width, height: r.height, position: r.position };
}

/** True when some price recorded in the last 7 days was higher than the current one. */
function hasPriceDropped(row: ListingRow): boolean {
  return row.priceHistory.some((h) => h.priceSom > row.priceSom);
}

export function toListingDetail(row: ListingRow): ListingDetail {
  return {
    id: row.id,
    title: row.title,
    // BigInt is not JSON-serialisable and may not fit in a number.
    priceSom: row.priceSom.toString(),
    priceUsd: row.priceUsd,
    rooms: row.rooms,
    areaM2: row.areaM2,
    floor: row.floor,
    district: row.district,
    address: row.address,
    landmark: row.landmark,
    description: row.description,
    type: row.type,
    deal: row.deal,
    views: row.views,
    listedAt: dateText(row.listedAt),
    lat: row.lat,
    lng: row.lng,
    priceDropped: hasPriceDropped(row),
    images: [...row.images].sort((a, b) => a.position - b.position).map(imageDto),
    agent: {
      id: row.agent.id,
      name: row.agent.name,
      agency: row.agent.agency,
      photoUrl: row.agent.photoUrl,
      phone: row.agent.phone,
      telegram: row.agent.telegram,
    },
  };
}

export function toListingSummary(row: ListingRow): ListingSummary {
  const firstImage = [...row.images].sort((a, b) => a.position - b.position)[0];
  return {
    id: row.id,
    title: row.title,
    priceSom: row.priceSom.toString(),
    priceUsd: row.priceUsd,
    rooms: row.rooms,
    areaM2: row.areaM2,
    floor: row.floor,
    district: row.district,
    landmark: row.landmark,
    type: row.type,
    deal: row.deal,
    listedAt: dateText(row.listedAt),
    lat: row.lat,
    lng: row.lng,
    image: firstImage ? imageDto(firstImage) : null,
    // The list response carries only the first image, but the card's "1/8" counter
    // needs the total — cheaper than sending the whole array.
    imageCount: row.images.length,
    priceDropped: hasPriceDropped(row),
  };
}
