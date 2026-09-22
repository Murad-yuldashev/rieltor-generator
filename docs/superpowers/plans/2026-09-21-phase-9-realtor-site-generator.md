# Phase 9 — Realtor Site Generator (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing `/r/:slug` realtor microsite into a branded, filterable catalogue site with contact + lead capture, gated on an active subscription (slug-only; custom domain deferred to 9.2).

**Architecture:** Extend `RealtorProfile` (additive branding/contact/SEO/publish columns) → surface through the existing `GET /api/r/:slug` (`PublicRealtorSchema`, now carrying `siteActive`) → render in `apps/web` `RealtorPage` by reusing the marketplace filter stack client-side over the payload's listings, themed by overriding `--color-accent` on the site root. A new public `POST /api/r/:slug/inquiry` upserts the visitor by phone and creates a realtor-attributed `PropertyRequest` (lands in `/leads`) + notifies. `SubscriptionService.isActive()` gates all three public surfaces (API, SSR meta, SPA).

**Tech Stack:** React 19, React Router 7, Tailwind v4 (`--color-accent`/`--brand` CSS-var theming), TanStack Query 5, FSD; apps/api NestJS + Prisma 6 (one additive migration).

**Spec:** [docs/superpowers/specs/2026-09-21-phase-9-realtor-site-generator-design.md](../specs/2026-09-21-phase-9-realtor-site-generator-design.md)

## Global Constraints

- Code/identifiers/comments **English**; UI copy **Uzbek**.
- **No new test files.** Verify each task with root turbo `yarn turbo run typecheck lint build --filter=@rieltor/web --filter=@rieltor/agent --filter=@rieltor/api` (never `yarn workspace <pkg> lint` — exit 127); plus live smoke at the end. Editing the existing seed is allowed.
- **Additive migration only** — new nullable/defaulted `RealtorProfile` columns + one additive `NotificationType` member. No drops/type-changes. Run `yarn migrate --name phase_9_realtor_site_generator` from `apps/api` (= `prisma migrate dev`), then `yarn workspace @rieltor/api generate`. Prod/CI apply via `migrate:deploy`.
- **BigInt money stays a string** end-to-end; never `Number()` a `priceSom`.
- **Reuse the marketplace filter stack** (`@/features/listing-filters`, `@/entities/listing` `ListingCard`) — do NOT rebuild search; catalogue filtering runs client-side over the realtor's listing array.
- **`brandColor`/theme is data → CSS custom property only** (never raw DOM/CSS); server hex-validates `^#[0-9a-fA-F]{6}$`. URLs validated (`z.url()` — the repo's zod-v4 idiom), phones `canonicalizePhone`d to `998XXXXXXXXX` by the schema `.transform`, Telegram stored without `@`.
- **Privacy:** the public `/api/r/:slug` JSON never leaks internal fields; `seoTitle`/`seoDescription` are server-only (meta), never in `PublicRealtorSchema`. Contact fields are opt-in columns. The inquiry endpoint is rate-limited + phone-validated.
- **Routing trap:** `r` is BOTH `@Controller('r')` (`/api/r/:slug`) and the public SPA/SSR path. The inquiry route is `/api/r/:slug/inquiry` (a controller method, NOT added to `SPA_ROUTES`); realtor SSR stays in `not-found-shell.filter`.
- `imageVariantSrc` widths ∈ {360,720,1200}. `apps/crm` untouched.

---

## File Structure

- **Task 1 (data contract):** modify `apps/api/prisma/schema.prisma`, create the generated migration, modify `packages/shared/src/schemas.ts`, `apps/api/src/realtor-public/realtor-public.service.ts` (`getBySlug`) + `realtor-public.module.ts`, `apps/api/src/agent/profile.service.ts` (`get`/`update`).
- **Task 2 (inquiry API):** modify `apps/api/src/realtor-public/{realtor-public.controller,realtor-public.service,realtor-public.module}.ts`, `apps/api/src/notifications/notifications.service.ts`.
- **Task 3 (catalogue web):** create `apps/web/src/pages/realtor/lib/brand-theme.ts`, rewrite `apps/web/src/pages/realtor/ui/realtor-page.tsx`.
- **Task 4 (contact + inquiry form):** create `apps/web/src/pages/realtor/ui/contact-section.tsx` (+ inquiry form), create `apps/web/src/pages/realtor/api.ts` inquiry mutation, mount in `realtor-page.tsx`.
- **Task 5 (branding editor):** modify `apps/api/src/agent/profile.service.ts` (`setCover`) + `profile-logo.controller.ts`, `apps/agent/src/features/profile/{use-profile.ts,index.ts}`, `apps/agent/src/pages/profile/ui/{profile-page.tsx,profile-preview.tsx}`.
- **Task 6 (SSR + SEO):** modify `apps/api/src/ssr/meta.ts`, `apps/api/src/ssr/not-found-shell.filter.ts`, `apps/api/src/realtor-public/realtor-public.service.ts` (`getSiteMeta`).
- **Task 7 (seed):** modify `apps/api/prisma/seed-realtor.ts`.

---

## Task 1: Data contract — DB migration + shared schema + read/write mappers

**Files:**

- Modify: `apps/api/prisma/schema.prisma` (RealtorProfile columns + NotificationType member)
- Create: `apps/api/prisma/migrations/<generated>_phase_9_realtor_site_generator/migration.sql` (via `prisma migrate dev`)
- Modify: `packages/shared/src/schemas.ts`, `apps/api/src/realtor-public/realtor-public.service.ts`, `apps/api/src/realtor-public/realtor-public.module.ts`, `apps/api/src/agent/profile.service.ts`

**Interfaces (Produced — consumed by every later task):**

- `RealtorProfile` model gains: `coverImageUrl/tagline/contactPhone/contactTelegram/contactWhatsapp/instagramUrl/telegramChannelUrl/seoTitle/seoDescription: String?`, `sitePublished Boolean @default(true)`. `NotificationType` gains `LEAD_INQUIRY`.
- `PublicRealtorSchema` gains `coverImageUrl/tagline/contactPhone/contactTelegram/contactWhatsapp/instagramUrl/telegramChannelUrl: string|null` + `siteActive: boolean` (NO seo fields). `RealtorProfileSchema` (cabinet read) gains those + `seoTitle/seoDescription/sitePublished`. `RealtorProfileUpdateSchema` gains the editable ones (NO `coverImageUrl`/`logoUrl` — upload-only). New `RealtorInquiryCreateSchema` + `type RealtorInquiryCreate`.
- `RealtorPublicService.getBySlug(slug): Promise<PublicRealtor>` — returns the new fields + `siteActive`; reduced payload when inactive (never 404 a known slug).

- [ ] **Step 1: Edit `schema.prisma`.** Add `LEAD_INQUIRY` to `enum NotificationType` and the 10 columns to `model RealtorProfile` after `brandColor`:

```prisma
enum NotificationType {
  PRICE_UPDATE
  LEAD_INQUIRY // Phase 9: a site visitor's inquiry landed as a realtor-attributed lead
}

// model RealtorProfile — insert after `brandColor String?`, before ratingSum:
  coverImageUrl      String?
  tagline            String?
  contactPhone       String?
  contactTelegram    String?
  contactWhatsapp    String?
  instagramUrl       String?
  telegramChannelUrl String?
  seoTitle           String?
  seoDescription     String?
  sitePublished      Boolean  @default(true)
```

- [ ] **Step 2: Generate the migration.** From `apps/api`: `yarn migrate --name phase_9_realtor_site_generator` (needs `DATABASE_URL` + a shadow DB; = `prisma migrate dev`). Prisma emits (one file, AlterEnum + AlterTable, per the `20260830084503_phase_4_1` precedent):

```sql
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LEAD_INQUIRY';
-- AlterTable
ALTER TABLE "RealtorProfile" ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "tagline" TEXT, ADD COLUMN "contactPhone" TEXT, ADD COLUMN "contactTelegram" TEXT,
ADD COLUMN "contactWhatsapp" TEXT, ADD COLUMN "instagramUrl" TEXT, ADD COLUMN "telegramChannelUrl" TEXT,
ADD COLUMN "seoTitle" TEXT, ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "sitePublished" BOOLEAN NOT NULL DEFAULT true;
```

Then `yarn workspace @rieltor/api generate` so `@prisma/client` types pick up the columns + enum member.

- [ ] **Step 3: Edit `packages/shared/src/schemas.ts`.** Add `import { canonicalizePhone } from './phone';` after the `zod` import. Add the two helper schemas above `RealtorProfileSchema`, extend the three schemas, add `RealtorInquiryCreateSchema`, widen `NotificationTypeSchema`, add the type export:

```ts
import { canonicalizePhone } from './phone';

const ContactPhoneSchema = z.string().trim().transform(canonicalizePhone)
  .refine((p) => /^998\d{9}$/.test(p), 'Telefon raqami noto‘g‘ri');
const TelegramHandleSchema = z.string().trim().transform((s) => s.replace(/^@/, ''))
  .refine((s) => /^[A-Za-z0-9_]{5,32}$/.test(s), 'Telegram username noto‘g‘ri');

// RealtorProfileSchema (cabinet read) — append after brandColor:
  coverImageUrl: z.string().nullable(),
  tagline: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactTelegram: z.string().nullable(),
  contactWhatsapp: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  telegramChannelUrl: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  sitePublished: z.boolean(),

// RealtorProfileUpdateSchema (write, all-optional) — append (coverImageUrl/logoUrl deliberately absent):
  tagline: z.string().trim().max(120).nullable().optional(),
  contactPhone: ContactPhoneSchema.nullable().optional(),
  contactWhatsapp: ContactPhoneSchema.nullable().optional(),
  contactTelegram: TelegramHandleSchema.nullable().optional(),
  instagramUrl: z.url().max(200).nullable().optional(),
  telegramChannelUrl: z.url().max(200).nullable().optional(),
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(200).nullable().optional(),
  sitePublished: z.boolean().optional(),

// PublicRealtorSchema (public read) — append branding/contact + siteActive (NO seo fields):
  coverImageUrl: z.string().nullable(),
  tagline: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactTelegram: z.string().nullable(),
  contactWhatsapp: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  telegramChannelUrl: z.string().nullable(),
  siteActive: z.boolean(),
  // (listings/reviews stay last)

// NEW — after RealtorProfileUpdateSchema (DealSchema already defined earlier):
export const RealtorInquiryCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().transform(canonicalizePhone)
    .refine((p) => /^998\d{9}$/.test(p), 'Telefon raqami noto‘g‘ri'),
  message: z.string().trim().min(1).max(1000),
  listingId: z.string().optional(),
  deal: DealSchema.optional(),
});

// widen (was z.enum(['PRICE_UPDATE'])):
export const NotificationTypeSchema = z.enum(['PRICE_UPDATE', 'LEAD_INQUIRY']);

// type block (~line 1361):
export type RealtorInquiryCreate = z.infer<typeof RealtorInquiryCreateSchema>;
```

- [ ] **Step 4: Rewrite `getBySlug` + wire the module.** In `realtor-public.module.ts` add `AgentModule` to `imports` (it exports `SubscriptionService`; no cycle — do NOT use `forwardRef`). In `realtor-public.service.ts` inject `SubscriptionService` and rewrite `getBySlug` — the reduced payload must include EVERY `PublicRealtorSchema` key. **CRITICAL (do NOT zero ratings):** `PublicRealtorSchema` has a SECOND consumer — the agent cabinet's "Baholarim" panel reads `/api/r/:slug` via `apps/agent/src/features/profile/use-my-rating.ts`. Ratings + APPROVED reviews are PUBLIC (not subscription-gated), so compute them BEFORE the `siteActive` branch and return the real values even when inactive (only the catalogue/branding is gated; Task 3's placeholder just won't render reviews):

```ts
import { SubscriptionService } from '../agent/subscription.service';
// constructor: private readonly subscriptions: SubscriptionService

async getBySlug(slug: string): Promise<PublicRealtor> {
  const profile = await this.prisma.realtorProfile.findUnique({
    where: { slug },
    include: { user: { select: { id: true, name: true, role: true,
      subscription: { select: { status: true, currentPeriodEnd: true } } } } },
  });
  if (!profile) throw new NotFoundException(); // ONLY unknown slug 404s
  const siteActive = profile.user.role === 'REALTOR'
    && this.subscriptions.isActive(profile.user.subscription) && profile.sitePublished;
  const name = profile.user.name ?? 'Rieltor';

  // Ratings + APPROVED reviews are PUBLIC and ALSO power the cabinet "Baholarim" panel
  // (use-my-rating.ts) — always compute/return them, even when the site is paused.
  const ratingAvg = profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null;
  const reviews = /* ...existing APPROVED-reviews query, unchanged (runs regardless of siteActive)... */;

  if (!siteActive) {
    return { name, agency: profile.agency, verified: profile.verified, siteActive: false,
      bio: null, regions: [], experienceYears: null, logoUrl: null, brandColor: null,
      coverImageUrl: null, tagline: null, contactPhone: null, contactTelegram: null,
      contactWhatsapp: null, instagramUrl: null, telegramChannelUrl: null,
      ratingAvg, ratingCount: profile.ratingCount, listings: [], reviews };
  }
  const rows = await this.prisma.listing.findMany({
    where: { ownerId: profile.userId, status: 'PUBLISHED' },
    include: FULL_INCLUDE, orderBy: { listedAt: 'desc' } });
  const listings = rows.map(toListingSummary);
  return { name, agency: profile.agency, bio: profile.bio, regions: profile.regions,
    experienceYears: profile.experienceYears, logoUrl: profile.logoUrl, brandColor: profile.brandColor,
    coverImageUrl: profile.coverImageUrl, tagline: profile.tagline, contactPhone: profile.contactPhone,
    contactTelegram: profile.contactTelegram, contactWhatsapp: profile.contactWhatsapp,
    instagramUrl: profile.instagramUrl, telegramChannelUrl: profile.telegramChannelUrl,
    verified: profile.verified, ratingCount: profile.ratingCount, ratingAvg,
    siteActive: true, reviews, listings };
}
```

- [ ] **Step 5: Update `profile.service.ts` get/update.** `get()` enumerates its return object — add every new read field with a default (`sitePublished: p?.sitePublished ?? true`, the rest `?? null`). `update()`'s upsert `create:` branch also enumerates — add every new field there (so a first-ever PATCH doesn't drop them). **Do NOT add manual `canonicalizePhone` in `update()`** — `ContactPhoneSchema.transform(canonicalizePhone)` in `RealtorProfileUpdateSchema` already canonicalizes at `.parse()` time (the controller parses before `update()`), so a manual line here is dead code referencing an unimported symbol:

```ts
// get() return — append:
    coverImageUrl: p?.coverImageUrl ?? null, tagline: p?.tagline ?? null,
    contactPhone: p?.contactPhone ?? null, contactTelegram: p?.contactTelegram ?? null,
    contactWhatsapp: p?.contactWhatsapp ?? null, instagramUrl: p?.instagramUrl ?? null,
    telegramChannelUrl: p?.telegramChannelUrl ?? null, seoTitle: p?.seoTitle ?? null,
    seoDescription: p?.seoDescription ?? null, sitePublished: p?.sitePublished ?? true,
// upsert create: branch — append the new fields (tagline/contact*/social/seo*/sitePublished ?? null/true).
```

- [ ] **Step 6: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/web --filter=@rieltor/agent --filter=@rieltor/api` green; from `apps/api`, `yarn seed` still runs.

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations packages/shared/src/schemas.ts apps/api/src/realtor-public apps/api/src/agent/profile.service.ts
git commit -m "feat(api): Phase 9 data contract — RealtorProfile site-config columns + LEAD_INQUIRY + getBySlug gating"
```

---

## Task 2: Public inquiry endpoint (`POST /api/r/:slug/inquiry`)

**Files:**

- Modify: `apps/api/src/notifications/notifications.service.ts` (widen `notify()` type union), `apps/api/src/realtor-public/realtor-public.controller.ts` (+ inquiry route), `apps/api/src/realtor-public/realtor-public.service.ts` (+ `createInquiry`), `apps/api/src/realtor-public/realtor-public.module.ts` (+ `NotificationsModule`)

**Interfaces:**

- Consumes: `RealtorInquiryCreateSchema`/`RealtorInquiryCreate` + `canonicalizePhone` (Task 1); `computeLeadScore`/`priceForScore` from `../leads/lead-scoring`; `NotificationsService.notify`.
- Produces: `RealtorPublicService.createInquiry(slug, ip, body): Promise<{ ok: true }>`; controller `@Post(':slug/inquiry')` (public, no guard).

- [ ] **Step 1: Widen `notify()`.** In `notifications.service.ts` change the `notify()` param `type: 'PRICE_UPDATE'` → `type: 'PRICE_UPDATE' | 'LEAD_INQUIRY'`.

- [ ] **Step 2: Add `createInquiry` + controller route + module import** (rate-limit via an in-process `Map`, the `views.service` pattern — no new dep; add `NotificationsModule` to `RealtorPublicModule.imports`; `NotificationsModule` exports `NotificationsService`):

```ts
// controller:
@Post(':slug/inquiry')
createInquiry(@Param('slug') slug: string, @Ip() ip: string, @Body() body: unknown) {
  return this.realtors.createInquiry(slug, ip, RealtorInquiryCreateSchema.parse(body));
}
// service (imports: HttpException, HttpStatus, ForbiddenException from @nestjs/common;
//  canonicalizePhone, type RealtorInquiryCreate from @rieltor/shared;
//  computeLeadScore, priceForScore from ../leads/lead-scoring; NotificationsService):
private readonly inquiryHits = new Map<string, number>();
private static readonly RL_WINDOW_MS = 60_000;
private static readonly RL_MAX_KEYS = 10_000;
// constructor also injects: private readonly notifications: NotificationsService

async createInquiry(slug: string, ip: string, body: RealtorInquiryCreate): Promise<{ ok: true }> {
  const key = JSON.stringify([ip, slug]); const now = Date.now();
  const last = this.inquiryHits.get(key);
  if (last !== undefined && now - last < RealtorPublicService.RL_WINDOW_MS)
    throw new HttpException("Juda ko'p so'rov, birozdan keyin urinib ko'ring", HttpStatus.TOO_MANY_REQUESTS);
  if (this.inquiryHits.size >= RealtorPublicService.RL_MAX_KEYS)
    for (const [k, t] of this.inquiryHits) if (now - t >= RealtorPublicService.RL_WINDOW_MS) this.inquiryHits.delete(k);
  this.inquiryHits.set(key, now);

  const profile = await this.prisma.realtorProfile.findUnique({ where: { slug },
    include: { user: { select: { id: true, role: true, subscription: { select: { status: true, currentPeriodEnd: true } } } } } });
  if (!profile) throw new NotFoundException();
  const siteActive = profile.user.role === 'REALTOR'
    && this.subscriptions.isActive(profile.user.subscription) && profile.sitePublished;
  if (!siteActive) throw new ForbiddenException('Sayt faol emas');

  let deal = body.deal ?? 'SALE'; let listingTag = '';
  if (body.listingId) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: body.listingId, ownerId: profile.userId, status: 'PUBLISHED' },
      select: { deal: true, title: true } });
    if (listing) { deal = listing.deal; listingTag = ` — ${listing.title}`; }
  }
  const phone = canonicalizePhone(body.phone);
  const visitor = await this.prisma.user.upsert({ where: { phone }, update: {}, create: { phone, name: body.name } });
  const createdAt = new Date();
  const score = computeLeadScore({ district: null, type: null, roomsMin: null, areaMinM2: null, note: body.message, priceMaxSom: null, createdAt });
  const lead = await this.prisma.propertyRequest.create({ data: {
    authorId: visitor.id, claimedById: profile.userId, claimedAt: createdAt,
    status: 'CLAIMED', outcomeStage: 'NEW', deal,
    note: `[Sayt so'rovi]${listingTag}: ${body.message}`, score, priceSom: priceForScore(score) },
    select: { id: true } });
  await this.notifications.notify(profile.userId, { type: 'LEAD_INQUIRY', title: "Yangi so'rov", body: `${body.name}${listingTag}`, targetId: lead.id });
  return { ok: true };
}
```

- [ ] **Step 3: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/api` green.

```bash
git add apps/api/src/realtor-public apps/api/src/notifications/notifications.service.ts
git commit -m "feat(api): public realtor-site inquiry endpoint — attributed lead + notify"
```

---

## Task 3: Branded catalogue (public page)

**Files:**

- Create: `apps/web/src/pages/realtor/lib/brand-theme.ts`
- Modify: `apps/web/src/pages/realtor/ui/realtor-page.tsx`

**Interfaces:**

- Consumes: `PublicRealtorSchema` fields (Task 1); `filterListings`/`EMPTY_CRITERIA`/`FilterPanel`/`SortSelect`/`ListingFacets`/`type Criteria` from `@/features/listing-filters`; `ListingCard` from `@/entities/listing`; `useInfiniteScroll` from `@/shared/lib/use-infinite-scroll`; `realtorQuery` from `../api`.
- Produces: `brandThemeVars(hex: string | null): CSSProperties | undefined`.

- [ ] **Step 1: Create `brand-theme.ts`** (pure hex shading, no deps; overrides the `@theme` accent trio so reused cards/filters rebrand):

```ts
import type { CSSProperties } from 'react';
function shade(hex: string, target: 0 | 255, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${ch.join('')}`;
}
export function brandThemeVars(hex: string | null): CSSProperties | undefined {
  if (!hex) return undefined;
  return {
    '--color-accent': hex,
    '--color-accent-dark': shade(hex, 0, 0.18),
    '--color-accent-soft': shade(hex, 255, 0.9),
    '--brand': hex,
  } as CSSProperties;
}
```

- [ ] **Step 2: Rewrite `RealtorPage`.** All catalogue hooks run BEFORE the early returns (Rules of Hooks). **KEEP every existing import** that `PageSkeleton`/`ReviewRow`/`ReviewForm`/`ReviewsSection` still use (`useEffect`, `useState`, `useQuery`, `useParams`, `useSession`, `LoginModal`, `formatListedAt`, `RatingStars`/star UI, etc.) and ADD the catalogue imports; keep `PageSkeleton` + `ReviewsSection` (and their helpers) unchanged. `Deal` is imported from `@rieltor/shared`. The deal handler ALSO resets `district` (a district present only in the realtor's RENT listings must not strand the default-SALE view on an empty result). No `favoriteSlot` (public page). Write it as:

```tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import type { Deal } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import {
  EMPTY_CRITERIA,
  FilterPanel,
  SortSelect,
  ListingFacets,
  filterListings,
  type Criteria,
} from '@/features/listing-filters';
import { useInfiniteScroll } from '@/shared/lib/use-infinite-scroll';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ApiError } from '@/shared/api/client';
import { NotFoundView } from '@/widgets/not-found';
import { realtorQuery } from '../api';
import { brandThemeVars } from '../lib/brand-theme';
// (PageSkeleton + ReviewsSection + their existing imports stay in this file, unchanged.)

const PAGE_SIZE = 8;

export function RealtorPage() {
  const { slug = '' } = useParams();
  const { data, isPending, error } = useQuery(realtorQuery(slug));

  // ALL hooks run unconditionally, BEFORE any early return (Rules of Hooks).
  const [criteria, setCriteria] = useState<Criteria>(EMPTY_CRITERIA);
  const [district, setDistrict] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const listings = data?.listings ?? [];
  const districts = useMemo(
    () => [...new Set(listings.map((l) => l.district))].sort((a, b) => a.localeCompare(b)),
    [listings],
  );
  const scoped = district ? listings.filter((l) => l.district === district) : listings;
  const matches = filterListings(scoped, criteria); // filterListings sorts by criteria.sort
  const shown = matches.slice(0, limit);
  const hasMore = matches.length > shown.length;
  const sentinelRef = useInfiniteScroll(hasMore, shown.length, () =>
    setLimit((n) => n + PAGE_SIZE),
  );

  const applyCriteria = (next: Criteria) => {
    setCriteria(next);
    setLimit(PAGE_SIZE);
  };
  const patch = (p: Partial<Criteria>) => applyCriteria({ ...criteria, ...p });
  // deal change resets the district facet so a stale RENT-only chip can't strand a SALE view.
  const pickDeal = (deal: Deal) => {
    setDistrict(null);
    applyCriteria({ ...criteria, deal });
  };
  const pickDistrict = (d: string | null) => {
    setDistrict(d);
    setLimit(PAGE_SIZE);
  };

  if (isPending) return <PageSkeleton />;
  if (error) {
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Rieltor sahifasini yuklab bo'lmadi.</p>;
  }

  const themeStyle = brandThemeVars(data.brandColor);

  if (!data.siteActive) {
    return (
      <main
        className="mx-auto flex min-h-dvh max-w-content items-center justify-center bg-surface p-6"
        style={themeStyle}
      >
        <div className="rounded-card border border-line/60 bg-card p-8 text-center">
          <h1 className="text-lg font-extrabold text-ink">{data.name}</h1>
          <p className="mt-2 text-[14px] font-medium text-ink-2">Bu sayt hozircha mavjud emas</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto min-h-dvh max-w-content bg-surface pb-10 md:max-w-none desk:max-w-none"
      style={themeStyle}
    >
      <header className="relative text-white">
        {data.coverImageUrl && (
          <img
            src={data.coverImageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="relative px-5 pt-8 pb-7"
          style={{
            background: data.coverImageUrl
              ? 'color-mix(in srgb, var(--brand, var(--color-accent)) 78%, transparent)'
              : 'var(--brand, var(--color-accent))',
          }}
        >
          <div className="mx-auto w-full max-w-content desk:max-w-desk desk:px-8">
            <div className="flex items-center gap-4">
              {data.logoUrl && (
                <img
                  src={data.logoUrl}
                  alt={data.name}
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/40 bg-white object-cover"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-2xl leading-tight font-extrabold">{data.name}</h1>
                {data.tagline && (
                  <p className="mt-1 text-[14px] font-semibold text-white/85">{data.tagline}</p>
                )}
                {data.agency && (
                  <p className="mt-0.5 text-[13px] font-medium text-white/75">{data.agency}</p>
                )}
                {data.verified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide">
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /> Tasdiqlangan
                  </span>
                )}
              </div>
            </div>
            {data.bio && (
              <p className="mt-4 text-[14px] leading-[1.55] font-medium text-white/90">
                {data.bio}
              </p>
            )}
            {(data.experienceYears !== null || data.regions.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {data.experienceYears !== null && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold">
                    {data.experienceYears} yil tajriba
                  </span>
                )}
                {data.regions.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Task 4 mounts <ContactSection slug={slug} … /> here. */}

      <div className="desk:mx-auto desk:w-full desk:max-w-desk desk:px-8">
        <section className="p-4 desk:px-0">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold text-ink">E'lonlar · {matches.length} ta</h2>
            <SortSelect value={criteria.sort} onChange={(sort) => patch({ sort })} />
          </div>
          <ListingFacets
            deal={criteria.deal}
            onDealChange={pickDeal}
            type={criteria.type}
            onTypeChange={(type) => patch({ type })}
          />
          {districts.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => pickDistrict(null)}
                className={cn(
                  'shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors',
                  district === null
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-card text-ink-2',
                )}
              >
                Barcha tumanlar
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDistrict(d)}
                  className={cn(
                    'shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors',
                    district === d
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-card text-ink-2',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <label className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3">
            <Icon name="search" className="h-[17px] w-[17px] text-ink-3" strokeWidth={2.2} />
            <input
              type="search"
              value={criteria.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder="Tuman, majmua yoki ko'cha qidiring..."
              aria-label="Qidiruv"
              className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
            />
          </label>
          <details className="mt-3 rounded-card border border-line/60 bg-card p-4">
            <summary className="cursor-pointer text-[14px] font-bold text-ink">Filtrlar</summary>
            <div className="mt-3">
              <FilterPanel value={criteria} onChange={applyCriteria} />
            </div>
          </details>
          {matches.length === 0 ? (
            <p className="mt-4 rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
              Bu shartlarga mos e'lon topilmadi
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5">
              {shown.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} isFirst={i === 0} />
              ))}
            </div>
          )}
          {hasMore && <div ref={sentinelRef} aria-hidden className="mt-4 h-px w-full" />}
        </section>
        <ReviewsSection
          slug={slug}
          ratingAvg={data.ratingAvg}
          ratingCount={data.ratingCount}
          reviews={data.reviews}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/web` green.

```bash
git add apps/web/src/pages/realtor
git commit -m "feat(web): branded realtor catalogue — reuse filter stack + brand theme override + hero"
```

---

## Task 4: Contact CTA + inquiry form (public page)

**Files:**

- Create: `apps/web/src/pages/realtor/ui/contact-section.tsx`
- Modify: `apps/web/src/pages/realtor/api.ts` (inquiry mutation), `apps/web/src/pages/realtor/ui/realtor-page.tsx` (mount the contact section)

**Interfaces:**

- Consumes: the contact fields on `data` (Task 1); `POST /api/r/:slug/inquiry` (Task 2); `apiPost` from `@/shared/api/client`.

- [ ] **Step 1: Add the inquiry mutation to `api.ts`** — `submitInquiry(slug, body)` posting to `/api/r/${slug}/inquiry` via `apiPost`, response validated with a tiny `z.object({ ok: z.literal(true) })` (or the shared type). Body: `{ name, phone, message, listingId? }`.

**MVP scope (per-listing inquiry deferred):** the contact form is a single **page-level general inquiry** this phase — no per-card "So'rov yuborish" CTA. The reused `ListingCard` exposes only `favoriteSlot`, which renders INSIDE its `<Link to="/obj/:id">`, so a per-card inquiry button there would navigate away — and editing the shared entity is out of scope. So the form does NOT send `listingId` (the backend's `listingId` handling from Task 2 is forward-looking/defensive and correctly falls back to a general inquiry when absent). A per-listing entry point is a later-phase enhancement.

- [ ] **Step 2: Create `contact-section.tsx`** — a `ContactSection` rendering only the opt-in fields present: call (`tel:+${contactPhone}`), Telegram (`https://t.me/${contactTelegram}`), WhatsApp (`https://wa.me/${contactWhatsapp}`), Instagram/Telegram-channel links; and a "Qo'ng'iroq so'rash" form (name, phone, message — NO `listingId`) using `useMutation` over `submitInquiry`, showing a success state ("So'rovingiz yuborildi") and error/loading. All accent styling reads `bg-accent`/`text-accent`/`var(--brand)` so it auto-rebrands. Uzbek labels.

- [ ] **Step 3: Mount it in `RealtorPage`** at the comment marker (`{/* Section 4's Contact CTA + inquiry form mount here */}`), passing the contact fields + `slug`.

- [ ] **Step 4: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/web` green.

```bash
git add apps/web/src/pages/realtor
git commit -m "feat(web): realtor site contact CTA + lead-capture inquiry form"
```

---

## Task 5: Branding editor + cover upload (agent cabinet)

**Files:**

- Modify: `apps/api/src/agent/profile.service.ts` (`setCover`), `apps/api/src/agent/profile-logo.controller.ts` (+ `@Post('cover')`), `apps/agent/src/features/profile/use-profile.ts` (`useSaveCover`) + `index.ts` (export), `apps/agent/src/pages/profile/ui/profile-page.tsx` (new fields + toggle + cover), `apps/agent/src/pages/profile/ui/profile-preview.tsx` (new props)

**Interfaces:**

- Consumes: Task 1 schemas + `profile.service` mappers; the existing `setLogo`/`processImage`/`imageVariantSrc`/`IMAGE_MAX_WIDTH` pipeline; `useSubscription`.
- Produces: `POST /api/agent/profile/cover` + `useSaveCover()`; `coverImageUrl` stored as **`result.ogUrl`** — the true **1200×630** OG JPEG that `processImage({ makeOg: true })` returns (matches the codebase-wide `ogUrl` OG convention + the seed's `/images/bx-001/og.jpg`). ONE correctly-sized image serves both the hero band and `og:image` (Task 6), so Task 6's fixed `og:image:width/height=1200/630` is accurate.

- [ ] **Step 1: `setCover` + controller route.** In `profile.service.ts` add `setCover` mirroring `setLogo` but `makeOg: true`, storing `result.ogUrl` (the 1200×630 crop). In `profile-logo.controller.ts` add `@Post('cover')` mirroring `uploadLogo` (same `FileInterceptor`/mime/size guards, `JwtGuard`+`RealtorGuard`, `ALLOWED_MIME_TYPES`/`MAX_FILE_SIZE_BYTES`):

```ts
// profile.service.ts
async setCover(userId: string, file: Express.Multer.File): Promise<RealtorProfile> {
  const result = await processImage({ source: file.buffer, outputRoot: PUBLIC_DIR,
    listingId: `cover-${userId}`, position: 1, makeOg: true });
  const coverImageUrl = result.ogUrl; // 1200×630 JPEG — hero + og:image (Task 6)
  await this.prisma.realtorProfile.upsert({ where: { userId },
    update: { coverImageUrl }, create: { userId, agency: '', coverImageUrl } });
  return this.get(userId);
}
// profile-logo.controller.ts
@Post('cover')
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
uploadCover(@CurrentUser() user: { id: string }, @UploadedFile() file?: Express.Multer.File) {
  if (!file) throw new BadRequestException('Rasm fayli talab qilinadi');
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new BadRequestException('Faqat JPEG, PNG yoki WebP formatidagi rasm qabul qilinadi');
  return this.profiles.setCover(user.id, file);
}
```

- [ ] **Step 2: `useSaveCover` hook + barrel export.** In `use-profile.ts` add `useSaveCover()` mirroring `useSaveLogo` (`apiUpload('/api/agent/profile/cover', formData, RealtorProfileSchema)`, `setQueryData(PROFILE_QUERY_KEY)` + invalidate). Export it from `features/profile/index.ts`.

- [ ] **Step 3: Editor form fields.** In `profile-page.tsx` add state for the 8 editable fields + `sitePublished` (seeded once in the existing `seeded` effect); add each to the changed-fields `patch` builder (canonicalize phones; strip a leading `@` from Telegram; empty string → `null`; client-side URL validation before `mutate`); a cover-upload input (`handleCoverChange` mirroring `handleLogoChange` → `saveCover.mutate(file)`); a `sitePublished` toggle button (`aria-pressed`, `markDirty()`); and a `siteLive = profile.sitePublished && !!subscription?.isActive` badge next to the `/r/:slug` link (via `useSubscription()`), plus an upsell line linking to `/subscribe` when `!subscription?.isActive`. Each field mirrors the existing changed-fields idiom: empty string → `null`; strip a leading `@` from `contactTelegram`; validate `instagramUrl`/`telegramChannelUrl` are full URLs before `mutate` (set `validationError` otherwise). (Phones are canonicalized server-side by the schema `.transform` — no client canonicalize needed.)

- [ ] **Step 4: `ProfilePreview` props.** Add the new props (`coverImageUrl?`, `tagline?`, `sitePublished?`, `contactPhone?`, `contactTelegram?`, `contactWhatsapp?`, `instagramUrl?`, `telegramChannelUrl?`) and render a cover thumb + tagline + contact chips + a live/paused indicator; keep the desktop-only `hidden lg:block`. Pass them from `profile-page.tsx`.

- [ ] **Step 5: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/agent --filter=@rieltor/api` green.

```bash
git add apps/api/src/agent apps/agent/src/features/profile apps/agent/src/pages/profile
git commit -m "feat(agent): realtor site branding editor — cover upload + contact/SEO fields + publish toggle"
```

---

## Task 6: SSR subscription gating + SEO/OG

**Files:**

- Modify: `apps/api/src/ssr/meta.ts` (`RealtorSiteMeta` + `buildRealtorMetaTags` + JSON-LD), `apps/api/src/ssr/not-found-shell.filter.ts` (realtor branch → `getSiteMeta`), `apps/api/src/realtor-public/realtor-public.service.ts` (`getSiteMeta`)

**Interfaces:**

- Produces: `interface RealtorSiteMeta`; `buildRealtorMetaTags(site: RealtorSiteMeta, slug, baseUrl): string` (first param renamed `site`, NOT `meta` — avoids shadowing the module `meta()` helper); `RealtorPublicService.getSiteMeta(slug): Promise<RealtorSiteMeta>` (server-only, no HTTP route; throws `NotFoundException` only for an unknown slug).
- Do NOT modify `SPA_ROUTES` / `ssr.controller.ts` — `/r` stays filter-only.

- [ ] **Step 1: `getSiteMeta`** (server-only, no HTTP route; reuses the `SubscriptionService` from Task 1). Throws `NotFoundException` only for an unknown slug; a known-but-paused slug returns `siteActive: false`. `seoTitle`/`seoDescription` live HERE (server-only) — never in `PublicRealtorSchema`:

```ts
async getSiteMeta(slug: string): Promise<RealtorSiteMeta> {
  const profile = await this.prisma.realtorProfile.findUnique({ where: { slug },
    include: { user: { select: { id: true, name: true, role: true,
      subscription: { select: { status: true, currentPeriodEnd: true } } } } } });
  if (!profile) throw new NotFoundException();
  const siteActive = profile.user.role === 'REALTOR'
    && this.subscriptions.isActive(profile.user.subscription) && profile.sitePublished;
  let listingCount = 0; let firstListingImageOgUrl: string | null = null;
  if (siteActive) {
    listingCount = await this.prisma.listing.count({ where: { ownerId: profile.userId, status: 'PUBLISHED' } });
    const first = await this.prisma.listing.findFirst({ where: { ownerId: profile.userId, status: 'PUBLISHED' },
      orderBy: { listedAt: 'desc' }, select: { images: { where: { position: 1 }, select: { ogUrl: true }, take: 1 } } });
    firstListingImageOgUrl = first?.images[0]?.ogUrl ?? null;
  }
  return { name: profile.user.name ?? 'Rieltor', agency: profile.agency,
    bio: siteActive ? profile.bio : null, logoUrl: siteActive ? profile.logoUrl : null,
    coverImageUrl: siteActive ? profile.coverImageUrl : null,
    seoTitle: siteActive ? profile.seoTitle : null, seoDescription: siteActive ? profile.seoDescription : null,
    listingCount, firstListingImageOgUrl, regions: siteActive ? profile.regions : [],
    ratingAvg: profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null,
    ratingCount: profile.ratingCount, siteActive };
}
```

- [ ] **Step 2: `meta.ts`** — add `interface RealtorSiteMeta`, a `jsonLdScript()` helper, `buildRealtorJsonLd()`, and rewrite `buildRealtorMetaTags`. **The first param is `site`, NOT `meta`** (a param named `meta` shadows the module-level `meta()` helper — real bug). **JSON-LD is a `<script>` text node**, so unicode-escape `<`/`>`/`&` (NOT `escapeHtml`, which corrupts the JSON):

```ts
export interface RealtorSiteMeta {
  name: string;
  agency: string;
  bio: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  listingCount: number;
  firstListingImageOgUrl: string | null;
  regions: string[];
  ratingAvg: number | null;
  ratingCount: number;
  siteActive: boolean;
}
function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">${json}</script>`;
}
function buildRealtorJsonLd(site: RealtorSiteMeta, pageUrl: string, baseUrl: string): string {
  const image = site.coverImageUrl ?? site.logoUrl ?? site.firstListingImageOgUrl;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: site.agency || site.name,
    url: pageUrl,
  };
  const desc = site.seoDescription?.trim() || site.bio?.trim();
  if (desc) data.description = truncate(desc);
  if (site.logoUrl) data.logo = `${baseUrl}${site.logoUrl}`;
  if (image) data.image = `${baseUrl}${image}`;
  if (site.regions.length) data.areaServed = site.regions;
  if (site.ratingCount > 0 && site.ratingAvg != null)
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(site.ratingAvg.toFixed(1)),
      reviewCount: site.ratingCount,
    };
  return jsonLdScript(data);
}
export function buildRealtorMetaTags(site: RealtorSiteMeta, slug: string, baseUrl: string): string {
  const pageUrl = `${baseUrl}/r/${slug}`;
  if (!site.siteActive) {
    return [
      `<title>${escapeHtml(site.name)}</title>`,
      meta('name', 'robots', 'noindex'),
      `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    ].join('\n    ');
  }
  const title = site.seoTitle?.trim()
    ? site.seoTitle.trim()
    : site.agency
      ? `${site.name} \u00b7 ${site.agency}`
      : site.name;
  const description = site.seoDescription?.trim()
    ? truncate(site.seoDescription)
    : site.bio
      ? truncate(site.bio)
      : `${site.listingCount} e'lon`;
  const relativeImage = site.coverImageUrl ?? site.logoUrl ?? site.firstListingImageOgUrl;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', site.agency || site.name),
    meta('property', 'og:url', pageUrl),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
  ];
  if (relativeImage) {
    const absolute = `${baseUrl}${relativeImage}`;
    tags.push(
      meta('property', 'og:image', absolute),
      meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
      meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      meta('name', 'twitter:image', absolute),
    );
  }
  tags.push(buildRealtorJsonLd(site, pageUrl, baseUrl));
  return tags.join('\n    ');
}
```

- [ ] **Step 3: `not-found-shell.filter.ts`** realtor branch — replace `getBySlug(slug)` with `getSiteMeta(slug)`, pass the meta object to `buildRealtorMetaTags(meta, slug, baseUrl)`; keep the `catch` that rethrows non-`NotFoundException` (unknown slug → plain 404 shell; known-but-paused returns `siteActive:false` → minimal head @200).

- [ ] **Step 4: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/api` green.

```bash
git add apps/api/src/ssr apps/api/src/realtor-public/realtor-public.service.ts
git commit -m "feat(api): realtor-site SSR gating + SEO/OG (agency site_name, cover OG, JSON-LD)"
```

---

## Task 7: Seed — populate `/r/aziz-rieltor`

**Files:**

- Modify: `apps/api/prisma/seed-realtor.ts`

**Interfaces:**

- Consumes: Task 1 columns (migration applied + client generated); `Listing.ownerId`/`status`; `resolveSeller` gate (`owner.role === 'REALTOR'` && `profile.slug`).

- [ ] **Step 1: Add branding + ownership to `seedRealtorCabinet`.** Add `SEED_SITE_LISTING_IDS` (8 `bx-*` across both deals, all 4 types, 6 districts; **exclude `bx-002`** — pinned by `e2e/listing-page.spec.ts`). Extend the existing `prisma.realtorProfile.create` data with `brandColor: '#7c3aed'`, `coverImageUrl: '/images/bx-001/og.jpg'` (a real 1200×630 asset — `bx-001` position-1 `makeOg`), `tagline`, `contactPhone: '998901112233'` (canonical), `contactTelegram: 'aziz_rieltor'` (no `@`), `contactWhatsapp`, `instagramUrl`, `telegramChannelUrl`, `seoTitle`, `seoDescription`, `sitePublished: true`. Immediately after, claim the listings (FK-safe — realtor User + `bx-*` already exist; idempotent under the `subscription.count()` guard):

```ts
const SEED_SITE_LISTING_IDS = [
  'bx-001',
  'bx-004',
  'bx-003',
  'bx-008',
  'bx-011',
  'bx-013',
  'bx-015',
  'bx-017',
];
// ... inside seedRealtorCabinet, right after prisma.realtorProfile.create({ ...new fields... }):
await prisma.listing.updateMany({
  where: { id: { in: SEED_SITE_LISTING_IDS } },
  data: { ownerId: SEED_REALTOR_ID, status: 'PUBLISHED' },
});
```

- [ ] **Step 2: Verify + commit.** `yarn turbo run typecheck lint build --filter=@rieltor/api` green; from `apps/api`, drop/recreate the dev DB (or a fresh volume) and `yarn seed` so the guard-early-return doesn't skip the backfill, then `yarn seed` again (idempotent — no duplicates).

```bash
git add apps/api/prisma/seed-realtor.ts
git commit -m "feat(api): seed realtor site — own 8 PUBLISHED listings + branding/contact/SEO"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** §0/§1 → Task 1; §2 → Task 1 (getBySlug); §4 → Task 2 (API) + Task 4 (form); §3 → Task 3; §5 → Task 5; §6 → Task 6 + Task 1 (API gating); §7 → Task 6; §8 → Task 7. All sections mapped.
- **Sequencing (hard deps):** Task 1 is the contract — every later task consumes its schema fields; the api/web/agent packages won't typecheck until it lands. Task 4 needs Task 2 (endpoint) + Task 3 (page). Task 6's `getSiteMeta` reuses the `AgentModule` import Task 1 added. Task 7 needs the migration from Task 1.
- **Type/name consistency:** `siteActive` (bool) on `PublicRealtorSchema` used in Tasks 1/3/6; `RealtorInquiryCreate` in Tasks 1/2/4; `brandThemeVars` in Task 3; `RealtorSiteMeta` + `buildRealtorMetaTags(site,…)` (param `site`, not `meta`) in Task 6; `useSaveCover` exported from the barrel (Task 5).
- **Gotchas folded:** reduced payload includes every schema key; `NotificationTypeSchema` widened (else `/api/notifications` parse fails); `profile.service` create-branch enumerates new fields; `coverImageUrl`/`logoUrl` upload-only (not in update schema); JSON-LD unicode-escaped (not `escapeHtml`); seo fields never in the public payload; `/r` inquiry route not in `SPA_ROUTES`; `bx-002` excluded from seed ownership (e2e); phones canonical, Telegram without `@`; BigInt `priceSom` never `Number()`; district facet layered locally (not added to shared `Criteria`).
- **Second `PublicRealtorSchema` consumer (critique):** `apps/agent/src/features/profile/use-my-rating.ts` (cabinet "Baholarim") also reads `/api/r/:slug` — so `getBySlug`'s reduced branch KEEPS `ratingAvg`/`ratingCount`/`reviews` (public data), not zeroing them; re-verify that panel with a paused/expired realtor, not only the anon public page.
- **Multi-lens critique folded:** 13 findings (1 must, 6 should, 6 nit, 0 rejected) all addressed — the ratings-regression fix above; cover stored as the 1200×630 `result.ogUrl` (OG dims accurate); the real code for `RealtorPage`/`setCover`/`getSiteMeta`/`buildRealtorMetaTags` inlined here (no "spec sketch" citations — the spec has no code blocks); §4 scoped to a page-level general inquiry (per-listing deferred; `ListingCard`'s only slot is inside its `/obj/:id` link); redundant `update()` canonicalize removed; `z.url()` idiom; district reset on deal change; optional `/subscribe` upsell line.

## Decomposition note

Phase 9.1 (this plan), 7 tasks, contract-first. The standard flow: spec → plan → multi-lens critique → SDD per-task review → whole-branch review → live smoke (anon `/r/aziz-rieltor` at 375/1200/1440: branded catalogue, filters, contact + inquiry → lead in `/leads`; paused-site placeholder; SEO/OG view-source) → merge on explicit authorization → memory update. Custom domain + XML feed/embeddable widget = Phase 9.2.
