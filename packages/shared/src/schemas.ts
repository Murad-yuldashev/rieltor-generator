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

/** Response of `POST /api/ai/description` — one generated field, kept in shared so web and API agree. */
export const AiDescriptionResultSchema = z.object({ description: z.string() });

/** Modeling assumption for the price-history trailing curve: ~0.8%/month (~10%/yr). */
export const MODELED_MONTHLY_GROWTH = 0.008;

/** Body of `POST /api/my/properties` — the params we value + track. */
export const TrackedPropertyCreateSchema = z.object({
  label: z.string().min(1).max(60).optional(),
  type: ListingTypeSchema,
  district: z.string().min(2),
  rooms: z.number().int().min(0).max(20).nullable(),
  areaM2: z.number().positive().max(10_000),
  floor: z.string().max(20).nullable().optional(),
});

export const SnapshotSourceSchema = z.enum(['MODELED', 'ACTUAL']);

export const PriceSnapshotSchema = z.object({
  estimateSom: z.string(),
  capturedAt: z.string(),
  source: SnapshotSourceSchema,
});

/** Cabinet card: property + latest estimate + monthly delta + sparkline points (oldest→newest). */
export const TrackedPropertySchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  type: ListingTypeSchema,
  district: z.string(),
  rooms: z.number().int().nullable(),
  areaM2: z.number(),
  floor: z.string().nullable(),
  createdAt: z.string(),
  estimateSom: z.string(),
  deltaPct: z.number(),
  sparkline: z.array(z.string()),
});

export const TrackedPropertyDetailSchema = TrackedPropertySchema.extend({
  snapshots: z.array(PriceSnapshotSchema),
});

export const NotificationTypeSchema = z.enum(['PRICE_UPDATE']);

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  targetId: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const NotificationListSchema = z.object({
  items: z.array(NotificationSchema),
  unreadCount: z.number().int(),
});

/** Body of `POST /api/requests` — a "Qidiryapman" buyer request. */
export const PropertyRequestCreateSchema = z.object({
  deal: DealSchema,
  type: ListingTypeSchema.nullable().optional(),
  district: z.string().min(2).nullable().optional(),
  roomsMin: z.number().int().min(0).max(20).nullable().optional(),
  priceMaxSom: z.string().regex(/^\d+$/).nullable().optional(),
  areaMinM2: z.number().positive().max(10_000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export const PropertyRequestSummarySchema = z.object({
  id: z.string(),
  deal: DealSchema,
  type: ListingTypeSchema.nullable(),
  district: z.string().nullable(),
  roomsMin: z.number().int().nullable(),
  priceMaxSom: z.string().nullable(),
  areaMinM2: z.number().nullable(),
  note: z.string().nullable(),
  status: z.enum(['OPEN', 'CLOSED']),
  createdAt: z.string(),
  authorPhoneMasked: z.string(),
});

/** Query params for `GET /api/requests` (all optional). `roomsMin` arrives as a string. */
export const PropertyRequestFilterSchema = z.object({
  deal: DealSchema.optional(),
  type: ListingTypeSchema.optional(),
  district: z.string().optional(),
  roomsMin: z.coerce.number().int().optional(),
  priceMaxSom: z.string().regex(/^\d+$/).optional(),
});

/** Response of `POST /api/requests/:id/contact` and the listing reveal. */
export const RevealedContactSchema = z.object({ phone: z.string() });

export const SubscriptionStatusSchema = z.enum(['TRIAL', 'ACTIVE', 'EXPIRED']);

export const SubscriptionViewSchema = z.object({
  status: SubscriptionStatusSchema,
  tier: z.string(),
  currentPeriodEnd: z.string(), // ISO
  isActive: z.boolean(), // computed: status !== EXPIRED && currentPeriodEnd > now
  daysLeft: z.number().int(), // clamped at 0
});

export const RealtorProfileSchema = z.object({
  agency: z.string(),
  bio: z.string().nullable(),
  regions: z.array(z.string()),
  experienceYears: z.number().int().nullable(),
});

export const RealtorProfileUpdateSchema = z.object({
  agency: z.string().min(2).max(80).optional(),
  bio: z.string().max(1000).nullable().optional(),
  regions: z.array(z.string().min(2)).max(14).optional(),
  experienceYears: z.number().int().min(0).max(70).nullable().optional(),
});

export const NoteUpsertSchema = z.object({ body: z.string().min(1).max(2000) });

export const NoteWithListingSchema = z.object({
  listingId: z.string(),
  body: z.string(),
  updatedAt: z.string(), // ISO
  listing: ListingSummarySchema,
});

export const CollectionSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  itemCount: z.number().int(),
  updatedAt: z.string(), // ISO
});

export const CollectionCreateSchema = z.object({ name: z.string().min(1).max(80) });
export const CollectionUpdateSchema = z.object({ name: z.string().min(1).max(80) });

export const CollectionItemSchema = z.object({
  listingId: z.string(),
  position: z.number().int(),
  note: z.string().nullable(),
  listing: ListingSummarySchema,
});

export const CollectionDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(CollectionItemSchema), // ordered by position asc
});

export const CollectionAddItemSchema = z.object({ listingId: z.string().min(1) });
export const CollectionReorderSchema = z.object({ listingIds: z.array(z.string().min(1)) });

/** Body of `PATCH /api/my/collections/:id/items/:listingId` — the per-item note. */
export const CollectionItemNoteSchema = z.object({ note: z.string().max(500).nullable() });

export const PresentationSummarySchema = z.object({
  id: z.string(),
  token: z.string(),
  title: z.string(),
  clientLabel: z.string().nullable(),
  createdAt: z.string(), // ISO
  opensCount: z.number().int(), // presentation-open events (listingId null)
  url: z.string(), // `${PUBLIC_BASE_URL}/p/${token}`
});

export const PresentationAnalyticsItemSchema = z.object({
  listingId: z.string(),
  position: z.number().int(),
  note: z.string().nullable(),
  listing: ListingSummarySchema,
  opens: z.number().int(), // per-listing view events
  avgDurationMs: z.number().int(), // rounded average dwell (0 when no dwell recorded)
});

export const PresentationDetailSchema = z.object({
  id: z.string(),
  token: z.string(),
  title: z.string(),
  clientLabel: z.string().nullable(),
  createdAt: z.string(),
  url: z.string(),
  totalOpens: z.number().int(),
  items: z.array(PresentationAnalyticsItemSchema), // ordered by position asc
});

export const PublicPresentationItemSchema = z.object({
  listingId: z.string(),
  position: z.number().int(),
  note: z.string().nullable(),
  listing: ListingSummarySchema,
});

export const PublicPresentationSchema = z.object({
  title: z.string(),
  realtorName: z.string(), // User.name (or a fallback)
  agency: z.string().nullable(), // RealtorProfile.agency, if any
  items: z.array(PublicPresentationItemSchema), // ordered by position asc
});

export const PresentationCreateResultSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string(),
});

export const PresentationViewEventSchema = z.object({
  listingId: z.string().nullable().optional(),
  durationMs: z.number().int().nonnegative().max(3_600_000).optional(), // cap 1h
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
export type AiDescriptionResult = z.infer<typeof AiDescriptionResultSchema>;
export type TrackedPropertyCreate = z.infer<typeof TrackedPropertyCreateSchema>;
export type TrackedProperty = z.infer<typeof TrackedPropertySchema>;
export type TrackedPropertyDetail = z.infer<typeof TrackedPropertyDetailSchema>;
export type PriceSnapshot = z.infer<typeof PriceSnapshotSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationList = z.infer<typeof NotificationListSchema>;
export type PropertyRequestCreate = z.infer<typeof PropertyRequestCreateSchema>;
export type PropertyRequestSummary = z.infer<typeof PropertyRequestSummarySchema>;
export type PropertyRequestFilter = z.infer<typeof PropertyRequestFilterSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionView = z.infer<typeof SubscriptionViewSchema>;
export type RealtorProfile = z.infer<typeof RealtorProfileSchema>;
export type RealtorProfileUpdate = z.infer<typeof RealtorProfileUpdateSchema>;
export type NoteUpsert = z.infer<typeof NoteUpsertSchema>;
export type NoteWithListing = z.infer<typeof NoteWithListingSchema>;
export type CollectionSummary = z.infer<typeof CollectionSummarySchema>;
export type CollectionCreate = z.infer<typeof CollectionCreateSchema>;
export type CollectionUpdate = z.infer<typeof CollectionUpdateSchema>;
export type CollectionItem = z.infer<typeof CollectionItemSchema>;
export type CollectionDetail = z.infer<typeof CollectionDetailSchema>;
export type CollectionAddItem = z.infer<typeof CollectionAddItemSchema>;
export type CollectionReorder = z.infer<typeof CollectionReorderSchema>;
export type CollectionItemNote = z.infer<typeof CollectionItemNoteSchema>;
export type PresentationSummary = z.infer<typeof PresentationSummarySchema>;
export type PresentationAnalyticsItem = z.infer<typeof PresentationAnalyticsItemSchema>;
export type PresentationDetail = z.infer<typeof PresentationDetailSchema>;
export type PublicPresentationItem = z.infer<typeof PublicPresentationItemSchema>;
export type PublicPresentation = z.infer<typeof PublicPresentationSchema>;
export type PresentationCreateResult = z.infer<typeof PresentationCreateResultSchema>;
export type PresentationViewEvent = z.infer<typeof PresentationViewEventSchema>;
