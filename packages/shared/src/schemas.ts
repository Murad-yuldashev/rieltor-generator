import * as z from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  agency: z.string(),
  photoUrl: z.string(),
  /** Displayed on the public listing page; the real number is behind GET /api/objects/:id/contact. */
  phoneMasked: z.string(),
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
  /** First ~240 chars of the description, truncated server-side so the list payload stays small. The frontend clamps visually; this bounds the bytes. */
  descriptionShort: z.string(),
  /** Seller display name for the result-row seller panel. */
  agentName: z.string(),
  /** Seller agency/subtitle. */
  agencyName: z.string(),
  /** Masked phone for the seller panel — same masking as the detail payload. */
  agentPhoneMasked: z.string(),
});

export const ListingDetailSchema = ListingSummarySchema.omit({
  image: true,
  imageCount: true,
  // Superseded by the full `description` and nested `agent` object below —
  // these summary-only fields exist to keep the list payload small.
  descriptionShort: true,
  agentName: true,
  agencyName: true,
  agentPhoneMasked: true,
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

/**
 * Everything the six-step wizard collects. Every field is optional because a
 * draft is saved after each step; the submit endpoint is what enforces
 * completeness.
 */
export const ListingDraftSchema = z.object({
  deal: DealSchema.optional(),
  type: ListingTypeSchema.optional(),
  district: z.string().min(2).optional(),
  address: z.string().min(4).optional(),
  landmark: z.string().min(2).optional(),
  rooms: z.number().int().min(0).max(20).nullable().optional(),
  areaM2: z.number().positive().max(10_000).optional(),
  floor: z.string().nullable().optional(),
  title: z.string().min(10).max(120).optional(),
  description: z.string().min(20).max(4000).optional(),
  priceSom: z.string().regex(/^\d+$/).optional(),
  priceUsd: z.number().int().positive().optional(),
});

/** Fields that must be present before a draft may go to moderation. */
export const LISTING_REQUIRED_FIELDS = [
  'deal',
  'type',
  'district',
  'address',
  'landmark',
  'areaM2',
  'title',
  'description',
  'priceSom',
  'priceUsd',
] as const;

/** Body of `POST /api/moderation/listings/:id/reject`. */
export const ModerationRejectSchema = z.object({
  reason: z.string().min(1),
});

/** Body of `POST /api/my/saved-searches`. */
export const SavedSearchCreateSchema = z.object({
  name: z.string().min(1).max(80),
  /** The search page's query string (no leading "?"), replayed verbatim on open. */
  query: z.string(),
});

export const SavedSearchSchema = SavedSearchCreateSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});

/** Body of `POST /api/valuation` — the "Uyingiz qancha turadi?" seller hook. */
export const ValuationRequestSchema = z.object({
  district: z.string().min(2),
  rooms: z.number().int().min(0).max(20).nullable(),
  areaM2: z.number().positive().max(10_000),
  type: ListingTypeSchema,
});

export const ValuationResultSchema = z.object({
  estimateSom: z.string(), // BigInt-as-string, like priceSom
  lowSom: z.string(),
  highSom: z.string(),
  perM2Som: z.string(),
  /** How many PUBLISHED listings backed the median — drives a confidence hint. */
  comparablesCount: z.number().int(),
  explanation: z.string(),
});

/** Body of `POST /api/ai/description` — Gemini drafts a description from the wizard's fields. */
export const AiDescriptionRequestSchema = z.object({
  type: ListingTypeSchema,
  deal: DealSchema,
  district: z.string().min(2),
  rooms: z.number().int().nullable().optional(),
  areaM2: z.number().positive(),
  floor: z.string().nullable().optional(),
  landmark: z.string().optional(),
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
export type ListingDraft = z.infer<typeof ListingDraftSchema>;
export type ModerationReject = z.infer<typeof ModerationRejectSchema>;
export type SavedSearchCreate = z.infer<typeof SavedSearchCreateSchema>;
export type SavedSearch = z.infer<typeof SavedSearchSchema>;
export type ValuationRequest = z.infer<typeof ValuationRequestSchema>;
export type ValuationResult = z.infer<typeof ValuationResultSchema>;
export type AiDescriptionRequest = z.infer<typeof AiDescriptionRequestSchema>;
