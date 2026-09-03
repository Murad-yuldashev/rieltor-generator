import * as z from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  agency: z.string(),
  photoUrl: z.string(),
  /** Displayed on the public listing page; the real number is behind GET /api/objects/:id/contact. */
  phoneMasked: z.string(),
  telegram: z.string(),
  /** Whether this seller has a moderator-granted verified badge. */
  verified: z.boolean(),
  /** Public profile slug, when the seller has one; links to /realtors/:slug. */
  profileSlug: z.string().nullable(),
  /** Average of APPROVED review ratings; null until the seller has any. */
  ratingAvg: z.number().nullable(),
  /** Count of APPROVED reviews backing `ratingAvg`. */
  ratingCount: z.number(),
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
  /** Drives the verified badge on a card's seller panel. */
  agentVerified: z.boolean(),
  /**
   * Seller's public profile slug, mirroring `Agent.profileSlug`. Null for the
   * default Agent (seed listings); set for a published realtor. Lets a card
   * tell a seed listing from an unverified real realtor so the legacy static
   * badge stays on seed rows while a real realtor's badge follows `agentVerified`.
   */
  agentProfileSlug: z.string().nullable(),
  /** Seller's average APPROVED review rating; null until they have any. Mirrors `Agent.ratingAvg`. */
  agentRatingAvg: z.number().nullable(),
  /** Count of APPROVED reviews backing `agentRatingAvg`. Mirrors `Agent.ratingCount`. */
  agentRatingCount: z.number(),
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
  role: z.enum(['USER', 'REALTOR', 'DEVELOPER', 'MODERATOR', 'ADMIN']),
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
  /** When the request is an inquiry about a published complex (5.3); persisted in a later phase. */
  complexId: z.string().optional(),
  /** When the inquiry targets a specific unit within that complex (5.3); persisted later. */
  unitId: z.string().optional(),
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
  /** Lifecycle: OPEN → CLAIMED (a realtor took it) or CLOSED; EXPIRED when the exclusive window lapses. */
  status: z.enum(['OPEN', 'CLOSED', 'CLAIMED', 'EXPIRED']),
  createdAt: z.string(),
  authorPhoneMasked: z.string(),
});

/** Funnel stage of a claimed lead's outcome, recorded by the realtor. */
export const LeadOutcomeStageSchema = z.enum(['NEW', 'CONTACTED', 'MEETING', 'WON', 'LOST']);

/** Why a lead was lost — set only when the outcome stage is LOST. */
export const LeadLostReasonSchema = z.enum([
  'NO_RESPONSE',
  'WRONG_NUMBER',
  'NOT_SERIOUS',
  'BOUGHT_ELSEWHERE',
  'OTHER',
]);

/**
 * The realtor feed row: `authorPhoneMasked` always, `phone` null until the caller
 * claims it. `score`/`priceSom` are lead-quality + claim-fee values that live only
 * here — they are served exclusively by the RealtorGuard-protected `GET /api/leads`,
 * never by the unguarded request endpoints or the buyer's own request rows.
 */
export const LeadSchema = PropertyRequestSummarySchema.extend({
  phone: z.string().nullable(),
  /** Lead quality score (0–100), always populated by the server. */
  score: z.number(),
  /** Server-estimated lead price in som — BigInt-as-string, like `priceMaxSom`. */
  priceSom: z.string(),
  /** Current outcome funnel stage; null until the realtor records an outcome. */
  outcomeStage: LeadOutcomeStageSchema.nullable(),
  /** Loss reason; set only when `outcomeStage` is LOST, otherwise null. */
  lostReason: LeadLostReasonSchema.nullable(),
  /** ISO timestamp of the last outcome update; null until first recorded. */
  outcomeUpdatedAt: z.string().nullable(),
});

/** The buyer's own request row plus whether a realtor has claimed it. */
export const MyLeadSchema = PropertyRequestSummarySchema.extend({
  claimed: z.boolean(),
});

/** Response of claiming a lead — the buyer's real contact, revealed to the claiming realtor. */
export const LeadClaimResponseSchema = z.object({
  phone: z.string(),
  name: z.string().nullable(),
});

/** Body of `PATCH /api/leads/:id/outcome` — record a claimed lead's outcome. */
export const LeadOutcomeUpdateSchema = z.object({
  stage: LeadOutcomeStageSchema,
  lostReason: LeadLostReasonSchema.optional(),
});

/** Count of leads at each outcome funnel stage. */
export const LeadFunnelSchema = z.object({
  NEW: z.number(),
  CONTACTED: z.number(),
  MEETING: z.number(),
  WON: z.number(),
  LOST: z.number(),
});

/** Count of lost leads broken down by loss reason. */
export const LeadLostReasonCountsSchema = z.object({
  NO_RESPONSE: z.number(),
  WRONG_NUMBER: z.number(),
  NOT_SERIOUS: z.number(),
  BOUGHT_ELSEWHERE: z.number(),
  OTHER: z.number(),
});

/** A single realtor's conversion analytics — funnel, win rate, and loss breakdown. */
export const LeadStatsSchema = z.object({
  funnel: LeadFunnelSchema,
  winRate: z.number().nullable(), // WON/(WON+LOST); null when no resolved leads
  lostReasons: LeadLostReasonCountsSchema,
});

/** Budget bucket a lead falls into, derived from `priceMaxSom`. */
export const BudgetTierSchema = z.enum(['NONE', 'LOW', 'MID', 'HIGH']);

/** One segment of platform-wide conversion, keyed by deal/type/budget tier. */
export const ConversionSegmentSchema = z.object({
  deal: LeadSchema.shape.deal, // reuse the Lead deal enum
  type: LeadSchema.shape.type, // reuse the Lead type (nullable) enum
  budgetTier: BudgetTierSchema,
  won: z.number(),
  lost: z.number(),
  winRate: z.number().nullable(),
});

/** Platform-wide conversion analytics — overall funnel plus per-segment breakdown. */
export const PlatformConversionSchema = z.object({
  funnel: LeadFunnelSchema,
  winRate: z.number().nullable(),
  segments: z.array(ConversionSegmentSchema),
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
  /** Public profile slug, when set; null until the realtor claims one. */
  slug: z.string().nullable(),
  /** Moderator-granted verified badge. */
  verified: z.boolean(),
  /** Optional brand logo URL for the public profile header. */
  logoUrl: z.string().nullable(),
  /** Optional brand accent colour ("#rrggbb") for the public profile. */
  brandColor: z.string().nullable(),
});

/** Slug rule: lowercase kebab, 3–40 chars, [a-z0-9-], not starting/ending with '-'. */
export const RealtorSlugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/);

export const RealtorProfileUpdateSchema = z.object({
  agency: z.string().min(2).max(80).optional(),
  bio: z.string().max(1000).nullable().optional(),
  regions: z.array(z.string().min(2)).max(14).optional(),
  experienceYears: z.number().int().min(0).max(70).nullable().optional(),
  slug: RealtorSlugSchema.nullable().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
});

/** Moderation lifecycle of a realtor review. */
export const ReviewStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

/** Body of `POST /api/realtors/:slug/reviews` — a buyer leaves a rating + optional note. */
export const ReviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/** One APPROVED review shown on the public realtor profile. */
export const PublicReviewSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  authorName: z.string(),
  authorPhotoUrl: z.string().nullable(),
  createdAt: z.string(),
});

/** The author's own review of a realtor (any status) — GET /api/realtors/:slug/reviews/mine. */
export const MyReviewSchema = z.object({
  rating: z.number().int(),
  comment: z.string().nullable(),
  status: ReviewStatusSchema,
});

/** Public realtor profile page — GET /api/realtors/:slug. Embeds the seller's live listings. */
export const PublicRealtorSchema = z.object({
  name: z.string(),
  agency: z.string(),
  bio: z.string().nullable(),
  regions: z.array(z.string()),
  experienceYears: z.number().int().nullable(),
  logoUrl: z.string().nullable(),
  brandColor: z.string().nullable(),
  verified: z.boolean(),
  /** Average of APPROVED review ratings; null until the realtor has any. */
  ratingAvg: z.number().nullable(),
  /** Count of APPROVED reviews backing `ratingAvg`. */
  ratingCount: z.number(),
  listings: z.array(ListingSummarySchema),
  /** APPROVED reviews, newest first. */
  reviews: z.array(PublicReviewSchema),
});

/** One row in the moderator's realtor table — GET /api/moderation/realtors. */
export const ModeratorRealtorRowSchema = z.object({
  userId: z.string(),
  name: z.string(),
  agency: z.string(),
  slug: z.string().nullable(),
  verified: z.boolean(),
});

/** Body of `POST /api/moderation/realtors/:userId/verify`. */
export const RealtorVerifySchema = z.object({ verified: z.boolean() });

/** One row in the moderator's review queue — GET /api/moderation/reviews. */
export const ModeratorReviewRowSchema = z.object({
  id: z.string(),
  realtorName: z.string(),
  realtorSlug: z.string().nullable(),
  authorName: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

/** Body of `POST /api/moderation/reviews/:id/moderate`. */
export const ReviewModerateSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

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

/** Kind of a wallet ledger entry: a prepaid top-up or a lead-claim debit. */
export const WalletTxTypeSchema = z.enum(['TOPUP', 'LEAD_CLAIM']);

/** One row in the wallet ledger. `amountSom` is BigInt-as-string; `leadId` is set only for LEAD_CLAIM. */
export const WalletTxRowSchema = z.object({
  id: z.string(),
  type: WalletTxTypeSchema,
  amountSom: z.string(),
  leadId: z.string().nullable(),
  createdAt: z.string(),
});

/** Cabinet wallet view: current balance plus the transaction ledger. */
export const WalletViewSchema = z.object({
  balanceSom: z.string(),
  transactions: z.array(WalletTxRowSchema),
});

/** The prepaid top-up packages a realtor can buy, in som (BigInt-as-string). */
export const TOPUP_PACKAGES = [
  { id: 'p100', amountSom: '100000' },
  { id: 'p300', amountSom: '300000' },
  { id: 'p500', amountSom: '500000' },
] as const;

/** Body of the wallet top-up request — the chosen package id. */
export const TopupSchema = z.object({ packageId: z.enum(['p100', 'p300', 'p500']) });

// --- Developer CRM: organization + inventory (Phase 5.1) ---

/** A member's role within a developer organization. */
export const OrgRoleSchema = z.enum(['OWNER', 'MANAGER']);

/** Build lifecycle of a residential complex. */
export const ComplexStatusSchema = z.enum(['PLANNED', 'UNDER_CONSTRUCTION', 'DONE']);

/** Marketplace publishing state of a complex (5.3): DRAFT until it goes live. */
export const ComplexPublishStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);

/** Sales lifecycle of a single unit. */
export const UnitStatusSchema = z.enum(['AVAILABLE', 'BOOKED', 'SOLD']);

/** One member of a developer organization. */
export const OrgMemberSchema = z.object({
  userId: z.string(),
  role: OrgRoleSchema,
  name: z.string().nullable(),
  phone: z.string(),
});

/** A developer organization plus its members. */
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  district: z.string().nullable(),
  members: z.array(OrgMemberSchema),
  /** Marketplace trust (5.3): moderator-granted verified badge. */
  verified: z.boolean(),
  /** When the org last requested verification; null until requested. */
  verificationRequestedAt: z.string().nullable(),
  /** When a moderator granted verification; null until verified. */
  verifiedAt: z.string().nullable(),
});

/** A residential complex owned by an organization. */
export const ComplexSchema = z.object({
  id: z.string(),
  name: z.string(),
  district: z.string(),
  address: z.string().nullable(),
  description: z.string().nullable(),
  status: ComplexStatusSchema,
  createdAt: z.string(),
  /** Public URL slug (5.3); null until published. */
  slug: z.string().nullable(),
  /** Marketplace publish state (5.3). */
  publishStatus: ComplexPublishStatusSchema,
  /** When the complex was first published; null while DRAFT. */
  publishedAt: z.string().nullable(),
  /** Map pin latitude (5.3); null until set. */
  latitude: z.number().nullable(),
  /** Map pin longitude (5.3); null until set. */
  longitude: z.number().nullable(),
  /** First gallery image by position, for CRM list cards; null when none. */
  coverImage: ImageSchema.nullable(),
  /** Number of gallery images. */
  imageCount: z.number().int(),
});

/** A building within a complex. */
export const BuildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  floors: z.number().int().nullable(),
  createdAt: z.string(),
});

/** A complex plus its buildings and full image gallery (CRM media manager). */
export const ComplexDetailSchema = ComplexSchema.extend({
  buildings: z.array(BuildingSchema),
  gallery: z.array(ImageSchema),
});

// --- Developer CRM: booking + shaxmatka (Phase 5.2) ---

/** Lifecycle of a unit booking / hold. */
export const BookingStatusSchema = z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'CONVERTED']);

/** Compact booking view embedded in a unit (the active hold, if any). */
export const BookingSummarySchema = z.object({
  id: z.string(),
  clientName: z.string(),
  clientPhone: z.string(),
  holdUntil: z.string(),
});

/** A full booking record. */
export const BookingSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  clientName: z.string(),
  clientPhone: z.string(),
  holdUntil: z.string(),
  status: BookingStatusSchema,
  note: z.string().nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.string(),
});

/** A booking row for org-wide lists — adds unit + building context. */
export const BookingRowSchema = BookingSchema.extend({
  unitNumber: z.string(),
  buildingName: z.string(),
});

/** A single unit within a building. */
export const UnitSchema = z.object({
  id: z.string(),
  buildingId: z.string(),
  number: z.string(),
  floor: z.number().int(),
  rooms: z.number().int().nullable(),
  areaM2: z.number().nullable(),
  priceSom: z.string().nullable(), // BigInt-as-string
  status: UnitStatusSchema,
  activeBooking: BookingSummarySchema.nullable(),
});

/** Body of `POST /api/crm/become-developer` — become a developer / create an organization. */
export const BecomeDeveloperSchema = z.object({
  name: z.string().trim().min(1).max(120),
  district: z.string().optional(),
});

/** Body of `POST /api/crm/complexes`. */
export const ComplexCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  district: z.string().trim().min(1),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  status: ComplexStatusSchema.optional(),
  /** Map pin latitude (5.3); WGS84 −90..90. */
  latitude: z.number().min(-90).max(90).optional(),
  /** Map pin longitude (5.3); WGS84 −180..180. */
  longitude: z.number().min(-180).max(180).optional(),
});
export const ComplexUpdateSchema = ComplexCreateSchema.partial();

/** Body of `POST /api/crm/complexes/:id/buildings`. */
export const BuildingCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  floors: z.number().int().positive().max(200).optional(),
});
export const BuildingUpdateSchema = BuildingCreateSchema.partial();

/** Body of `POST /api/crm/buildings/:id/units`. */
export const UnitCreateSchema = z.object({
  number: z.string().trim().min(1).max(40),
  floor: z.number().int().min(0).max(200),
  rooms: z.number().int().min(0).max(50).optional(),
  areaM2: z.number().positive().max(100000).optional(),
  priceSom: z.string().regex(/^\d+$/).optional(), // digits only; parsed to BigInt server-side
  status: UnitStatusSchema.optional(),
});
export const UnitUpdateSchema = UnitCreateSchema.partial();

/** Body of `POST /api/crm/units/:id/book` — create a hold on a unit. */
export const BookingCreateSchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  clientPhone: z.string().trim().min(3).max(30),
  holdDays: z.number().int().min(1).max(90).optional(),
  note: z.string().trim().max(1000).optional(),
});

/** Body of `PATCH /api/crm/bookings/:id` — cancel / convert / extend a hold. */
export const BookingActionSchema = z.object({
  action: z.enum(['cancel', 'convert', 'extend']),
  cancelReason: z.string().trim().max(500).optional(),
  holdDays: z.number().int().min(1).max(90).optional(),
});

/** Body of a shaxmatka bulk edit — set status and/or price on many units at once. */
export const UnitBulkUpdateSchema = z
  .object({
    unitIds: z.array(z.string()).min(1).max(500),
    status: UnitStatusSchema.optional(),
    priceSom: z.string().regex(/^\d+$/).optional(),
  })
  .refine((v) => v.status !== undefined || v.priceSom !== undefined, {
    message: 'status yoki priceSom kerak',
  });

// --- Marketplace publishing: public ЖК + verification (Phase 5.3) ---

/** One available/held/sold unit as shown on the public complex page. */
export const PublicUnitSchema = z.object({
  id: z.string(),
  number: z.string(),
  floor: z.number().int(),
  rooms: z.number().int().nullable(),
  areaM2: z.number().nullable(),
  priceSom: z.string().nullable(), // BigInt-as-string
  status: UnitStatusSchema,
});

/** A building with its units, on the public complex page. */
export const PublicBuildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  floors: z.number().int().nullable(),
  units: z.array(PublicUnitSchema),
});

/** A complex card in the public marketplace list. */
export const PublicComplexSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  district: z.string(),
  coverImage: ImageSchema.nullable(),
  buildStatus: ComplexStatusSchema,
  priceFromSom: z.string().nullable(), // cheapest available unit, BigInt-as-string
  unitsAvailable: z.number().int(),
  developerName: z.string(),
  developerVerified: z.boolean(),
});

/** The full public complex page — summary plus media, geo, and inventory. */
export const PublicComplexDetailSchema = PublicComplexSummarySchema.extend({
  description: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  gallery: z.array(ImageSchema),
  buildings: z.array(PublicBuildingSchema),
  unitsTotal: z.number().int(),
});

/** Body of `POST /api/complexes/:slug/inquiry` — a buyer's interest in a published complex. */
export const ComplexInquirySchema = z.object({
  note: z.string().trim().max(1000).optional(),
  unitId: z.string().optional(),
});

/** Body of `POST /api/moderation/developers/:orgId/verify` — grant/revoke a developer's badge. */
export const DeveloperVerifySchema = z.object({
  verified: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

/** One row in the moderator's developer table — GET /api/moderation/developers. */
export const ModeratorDeveloperRowSchema = z.object({
  orgId: z.string(),
  name: z.string(),
  district: z.string().nullable(),
  verified: z.boolean(),
  verificationRequestedAt: z.string().nullable(),
  complexCount: z.number().int(),
  memberPhone: z.string(),
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
export type Lead = z.infer<typeof LeadSchema>;
export type MyLead = z.infer<typeof MyLeadSchema>;
export type LeadClaimResponse = z.infer<typeof LeadClaimResponseSchema>;
export type LeadOutcomeStage = z.infer<typeof LeadOutcomeStageSchema>;
export type LeadLostReason = z.infer<typeof LeadLostReasonSchema>;
export type LeadOutcomeUpdate = z.infer<typeof LeadOutcomeUpdateSchema>;
export type LeadFunnel = z.infer<typeof LeadFunnelSchema>;
export type LeadLostReasonCounts = z.infer<typeof LeadLostReasonCountsSchema>;
export type LeadStats = z.infer<typeof LeadStatsSchema>;
export type BudgetTier = z.infer<typeof BudgetTierSchema>;
export type ConversionSegment = z.infer<typeof ConversionSegmentSchema>;
export type PlatformConversion = z.infer<typeof PlatformConversionSchema>;
export type PropertyRequestFilter = z.infer<typeof PropertyRequestFilterSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionView = z.infer<typeof SubscriptionViewSchema>;
export type RealtorProfile = z.infer<typeof RealtorProfileSchema>;
export type RealtorProfileUpdate = z.infer<typeof RealtorProfileUpdateSchema>;
export type PublicRealtor = z.infer<typeof PublicRealtorSchema>;
export type ModeratorRealtorRow = z.infer<typeof ModeratorRealtorRowSchema>;
export type RealtorVerify = z.infer<typeof RealtorVerifySchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type ReviewCreate = z.infer<typeof ReviewCreateSchema>;
export type PublicReview = z.infer<typeof PublicReviewSchema>;
export type MyReview = z.infer<typeof MyReviewSchema>;
export type ModeratorReviewRow = z.infer<typeof ModeratorReviewRowSchema>;
export type ReviewModerate = z.infer<typeof ReviewModerateSchema>;
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
export type WalletTxType = z.infer<typeof WalletTxTypeSchema>;
export type WalletTxRow = z.infer<typeof WalletTxRowSchema>;
export type WalletView = z.infer<typeof WalletViewSchema>;
export type Topup = z.infer<typeof TopupSchema>;
export type OrgRole = z.infer<typeof OrgRoleSchema>;
export type ComplexStatus = z.infer<typeof ComplexStatusSchema>;
export type ComplexPublishStatus = z.infer<typeof ComplexPublishStatusSchema>;
export type UnitStatus = z.infer<typeof UnitStatusSchema>;
export type OrgMember = z.infer<typeof OrgMemberSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type Complex = z.infer<typeof ComplexSchema>;
export type Building = z.infer<typeof BuildingSchema>;
export type ComplexDetail = z.infer<typeof ComplexDetailSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type BecomeDeveloper = z.infer<typeof BecomeDeveloperSchema>;
export type ComplexCreate = z.infer<typeof ComplexCreateSchema>;
export type ComplexUpdate = z.infer<typeof ComplexUpdateSchema>;
export type BuildingCreate = z.infer<typeof BuildingCreateSchema>;
export type BuildingUpdate = z.infer<typeof BuildingUpdateSchema>;
export type UnitCreate = z.infer<typeof UnitCreateSchema>;
export type UnitUpdate = z.infer<typeof UnitUpdateSchema>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type BookingSummary = z.infer<typeof BookingSummarySchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type BookingRow = z.infer<typeof BookingRowSchema>;
export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingAction = z.infer<typeof BookingActionSchema>;
export type UnitBulkUpdate = z.infer<typeof UnitBulkUpdateSchema>;
export type PublicUnit = z.infer<typeof PublicUnitSchema>;
export type PublicBuilding = z.infer<typeof PublicBuildingSchema>;
export type PublicComplexSummary = z.infer<typeof PublicComplexSummarySchema>;
export type PublicComplexDetail = z.infer<typeof PublicComplexDetailSchema>;
export type ComplexInquiry = z.infer<typeof ComplexInquirySchema>;
export type DeveloperVerify = z.infer<typeof DeveloperVerifySchema>;
export type ModeratorDeveloperRow = z.infer<typeof ModeratorDeveloperRowSchema>;
