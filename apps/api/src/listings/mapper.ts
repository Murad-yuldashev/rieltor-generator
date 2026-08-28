import type { Agent, Image, Listing } from '@prisma/client';
import {
  maskPhone,
  type Image as ImageDto,
  type ListingDetail,
  type ListingSummary,
} from '@rieltor/shared';

type OwnerWithProfile = {
  role: string;
  name: string | null;
  phone: string;
  photoUrl: string | null;
  realtorProfile: {
    agency: string;
    slug: string | null;
    verified: boolean;
    logoUrl: string | null;
    ratingSum: number;
    ratingCount: number;
  } | null;
};
export type ListingRow = Listing & {
  agent: Agent;
  images: Pick<Image, keyof ImageDto>[];
  owner?: OwnerWithProfile | null;
};

/** The seller shown publicly: the real realtor when the owner is a published REALTOR, else the default Agent. */
function resolveSeller(row: ListingRow) {
  const o = row.owner;
  const p = o?.realtorProfile;
  if (o?.role === 'REALTOR' && p?.slug) {
    return {
      id: row.agent.id, // keep the Agent id (schema shape unchanged)
      name: o.name ?? 'Rieltor',
      agency: p.agency,
      photoUrl: p.logoUrl ?? o.photoUrl ?? row.agent.photoUrl,
      phone: o.phone, // masked by the callers via maskPhone
      telegram: row.agent.telegram, // telegram CTA stays the Agent's for now
      verified: p.verified,
      profileSlug: p.slug,
      // Cached aggregate (Phase 3.3b T1): average is null until an APPROVED review exists.
      ratingAvg: p.ratingCount > 0 ? p.ratingSum / p.ratingCount : null,
      ratingCount: p.ratingCount,
    };
  }
  return {
    id: row.agent.id,
    name: row.agent.name,
    agency: row.agent.agency,
    photoUrl: row.agent.photoUrl,
    phone: row.agent.phone,
    telegram: row.agent.telegram,
    verified: false,
    profileSlug: null,
    // The default Agent (seed) carries no reviews — always null/0.
    ratingAvg: null,
    ratingCount: 0,
  };
}

/** @db.Date in the database, UTC midnight in JS — the first 10 ISO chars suffice. */
function dateText(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function imageDto(r: Pick<Image, keyof ImageDto>): ImageDto {
  return { base: r.base, ogUrl: r.ogUrl, width: r.width, height: r.height, position: r.position };
}

export function toListingDetail(row: ListingRow): ListingDetail {
  const s = resolveSeller(row);
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
    images: [...row.images].sort((a, b) => a.position - b.position).map(imageDto),
    // ListingDetail inherits agentVerified + agentProfileSlug from the summary
    // schema (neither is omitted there); mirror the resolved seller so the shape
    // stays consistent. The nested `agent` object below carries the same values.
    agentVerified: s.verified,
    agentProfileSlug: s.profileSlug,
    // ListingDetail extends the summary schema, so the summary-level rating
    // mirrors on the detail too (same as agentVerified/agentProfileSlug above).
    // The nested `agent` object below carries the same values.
    agentRatingAvg: s.ratingAvg,
    agentRatingCount: s.ratingCount,
    agent: {
      id: s.id,
      name: s.name,
      agency: s.agency,
      photoUrl: s.photoUrl,
      // The raw number is intentionally NOT part of the public payload — the real
      // number is revealed (and tracked as a ContactReveal) via GET /objects/:id/contact.
      phoneMasked: maskPhone(s.phone),
      telegram: s.telegram,
      verified: s.verified,
      profileSlug: s.profileSlug,
      ratingAvg: s.ratingAvg,
      ratingCount: s.ratingCount,
    },
  };
}

export function toListingSummary(row: ListingRow): ListingSummary {
  const s = resolveSeller(row);
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
    image: firstImage ? imageDto(firstImage) : null,
    // The list response carries only the first image, but the card's "1/8" counter
    // needs the total — cheaper than sending the whole array.
    imageCount: row.images.length,
    descriptionShort:
      row.description.length > 240
        ? row.description.slice(0, 240).trimEnd() + '…'
        : row.description,
    agentName: s.name,
    agencyName: s.agency,
    agentPhoneMasked: maskPhone(s.phone),
    agentVerified: s.verified,
    // Same resolved seller value `toListingDetail` puts on `agent.profileSlug`:
    // null for the default Agent (seed), the realtor's slug for a published one.
    agentProfileSlug: s.profileSlug,
    // Marketplace stars on the card — mirrors the resolved seller's rating.
    agentRatingAvg: s.ratingAvg,
    agentRatingCount: s.ratingCount,
  };
}
