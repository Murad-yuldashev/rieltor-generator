import type { Agent, Image, Listing } from '@prisma/client';
import type { Image as ImageDto, ListingDetail, ListingSummary } from '@rieltor/shared';

export type ListingRow = Listing & { agent: Agent; images: Pick<Image, keyof ImageDto>[] };

/** DB'da @db.Date, JS'da UTC yarim tuni — ISO ning birinchi 10 belgisi kifoya. */
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
    // BigInt JSON'ga serializatsiya qilinmaydi va number'ga sig'masligi mumkin.
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
    district: row.district,
    image: firstImage ? imageDto(firstImage) : null,
  };
}
