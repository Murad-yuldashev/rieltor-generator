import * as z from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  agency: z.string(),
  photoUrl: z.string(),
  phone: z.string(),
  telegram: z.string(),
});

export const ImageSchema = z.object({
  /** Variantsiz asos yo'l: "/images/bx-001/01" — imageSrcSet() bilan ishlatiladi. */
  base: z.string(),
  /** 1200×630 crop; faqat birinchi rasmda to'ldiriladi. */
  ogUrl: z.string().nullable(),
  width: z.number().int(),
  height: z.number().int(),
  position: z.number().int(),
});

export const ListingTypeSchema = z.enum(['NEW_BUILD', 'SECONDARY', 'HOUSE']);

export const ListingSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  /** BigInt number'ga sig'masligi mumkin — har doim string. */
  priceSom: z.string(),
  priceUsd: z.number().int(),
  rooms: z.number().int(),
  areaM2: z.number(),
  district: z.string(),
  image: ImageSchema.nullable(),
});

export const ListingDetailSchema = ListingSummarySchema.omit({ image: true }).extend({
  /** Hovlida qavat bo'lmaydi. */
  floor: z.string().nullable(),
  address: z.string(),
  landmark: z.string(),
  description: z.string(),
  type: ListingTypeSchema,
  views: z.number().int(),
  listedAt: z.string(),
  images: z.array(ImageSchema),
  agent: AgentSchema,
});

export const ViewsSchema = z.object({ views: z.number().int() });

export type Agent = z.infer<typeof AgentSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type ListingType = z.infer<typeof ListingTypeSchema>;
export type ListingSummary = z.infer<typeof ListingSummarySchema>;
export type ListingDetail = z.infer<typeof ListingDetailSchema>;
export type Views = z.infer<typeof ViewsSchema>;
