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
  image: ImageSchema.nullable(),
  /** Powers the "1/8" counter on a card — just the count, not the whole array. */
  imageCount: z.number().int(),
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

export const ViewsSchema = z.object({ views: z.number().int() });

/** Uzbek mobile numbers, E.164 without the plus. */
export const PhoneSchema = z
  .string()
  .regex(/^998\d{9}$/, 'Telefon raqami 998 bilan boshlanishi va 12 raqamdan iborat bo‘lishi kerak');

export const OtpRequestSchema = z.object({ phone: PhoneSchema });

export const OtpVerifySchema = z.object({
  phone: PhoneSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  photoUrl: z.string().nullable(),
  role: z.enum(['USER', 'REALTOR', 'MODERATOR', 'ADMIN']),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: AuthUserSchema,
});

/** The payload the Telegram Login widget hands back, verbatim. */
export const TelegramAuthSchema = z.object({
  id: z.number().int(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().int(),
  hash: z.string(),
});

export type Agent = z.infer<typeof AgentSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type ListingType = z.infer<typeof ListingTypeSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type ListingSummary = z.infer<typeof ListingSummarySchema>;
export type ListingDetail = z.infer<typeof ListingDetailSchema>;
export type Views = z.infer<typeof ViewsSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type TelegramAuth = z.infer<typeof TelegramAuthSchema>;
