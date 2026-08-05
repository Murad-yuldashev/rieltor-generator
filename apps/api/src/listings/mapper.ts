import type { Agent, Image, Listing } from '@prisma/client';
import type { Image as ImageDto, ListingDetail, ListingSummary } from '@rieltor/shared';

export type ListingRow = Listing & { agent: Agent; images: Pick<Image, keyof ImageDto>[] };

/** @db.Date in the database, UTC midnight in JS — the first 10 ISO chars suffice. */
function dateText(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function imageDto(r: Pick<Image, keyof ImageDto>): ImageDto {
  return { base: r.base, ogUrl: r.ogUrl, width: r.width, height: r.height, position: r.position };
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
    views: row.views,
    listedAt: dateText(row.listedAt),
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
    listedAt: dateText(row.listedAt),
    image: firstImage ? imageDto(firstImage) : null,
    // The list response carries only the first image, but the card's "1/8" counter
    // needs the total — cheaper than sending the whole array.
    imageCount: row.images.length,
  };
}
