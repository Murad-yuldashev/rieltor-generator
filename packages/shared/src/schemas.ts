import * as z from 'zod';
import { ListingStatusSchema } from './listing-status';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  agency: z.string(),
  photoUrl: z.string(),
  phone: z.string(),
  telegram: z.string(),
});

export const ImageSchema = z.object({
  /** Base path without a variant: "/images/bx-001/01" — used with imageSrcSet(). */
  base: z.string(),
  /** 1200×630 crop; filled in for the first image only. */
  ogUrl: z.string().nullable(),
  width: z.number().int(),
  height: z.number().int(),
  position: z.number().int(),
});

export const ListingTypeSchema = z.enum(['NEW_BUILD', 'SECONDARY', 'HOUSE', 'COMMERCIAL']);

/** Which segment a listing belongs to — orthogonal to its type. */
export const DealSchema = z.enum(['SALE', 'RENT']);

export const ListingSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  /**
   * A BigInt may not fit in a number — always a string.
   * For a RENT listing this is the price per month.
   */
  priceSom: z.string(),
  priceUsd: z.number().int(),
  /** Commercial premises are not measured in rooms. */
  rooms: z.number().int().nullable(),
  areaM2: z.number(),
  /** Houses have no floor. */
  floor: z.string().nullable(),
  district: z.string(),
  /** The geo line on a card: "Metro «Shahriston» 10 daq." */
  landmark: z.string(),
  /** Drives the coloured badge on a card (new build / secondary / house / commercial). */
  type: ListingTypeSchema,
  /** Drives the "Sotib olish / Ijara" segment and the "/oy" price suffix. */
  deal: DealSchema,
  listedAt: z.string(),
  /** WGS84; null when the listing has no pin yet. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  image: ImageSchema.nullable(),
  /** Powers the "1/8" counter on a card — just the count, not the whole array. */
  imageCount: z.number().int(),
  /** True when a PriceHistory drop was recorded in the last 7 days (design spec §7.6). */
  priceDropped: z.boolean(),
});

export const ListingDetailSchema = ListingSummarySchema.omit({
  image: true,
  imageCount: true,
}).extend({
  address: z.string(),
  description: z.string(),
  views: z.number().int(),
  images: z.array(ImageSchema),
  agent: AgentSchema,
});

/** The card the realtor sees in their own cabinet — the public summary plus status. */
export const OwnerListingSummarySchema = ListingSummarySchema.extend({
  status: ListingStatusSchema,
});

/** The listing the realtor edits — the public detail plus status. */
export const OwnerListingDetailSchema = ListingDetailSchema.extend({
  status: ListingStatusSchema,
});

/**
 * One item in a realtor's public "sold/rented" portfolio on /r/:username (design
 * spec §9.1) — the public summary plus which lifecycle it ended in (SOLD vs RENTED
 * need different Uzbek wording) and how many days the sale took.
 */
export const SoldListingSchema = ListingSummarySchema.extend({
  status: ListingStatusSchema,
  /** soldAt − publishedAt, in whole days. */
  soldInDays: z.number().int(),
});

export const ViewsSchema = z.object({ views: z.number().int() });

export type Agent = z.infer<typeof AgentSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type ListingType = z.infer<typeof ListingTypeSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type ListingSummary = z.infer<typeof ListingSummarySchema>;
export type ListingDetail = z.infer<typeof ListingDetailSchema>;
export type OwnerListingSummary = z.infer<typeof OwnerListingSummarySchema>;
export type OwnerListingDetail = z.infer<typeof OwnerListingDetailSchema>;
export type SoldListing = z.infer<typeof SoldListingSchema>;
export type Views = z.infer<typeof ViewsSchema>;
