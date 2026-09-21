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
- **`brandColor`/theme is data → CSS custom property only** (never raw DOM/CSS); server hex-validates `^#[0-9a-fA-F]{6}$`. URLs validated (`z.string().url()`), phones `canonicalizePhone`d to `998XXXXXXXXX`, Telegram stored without `@`.
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
  instagramUrl: z.string().url().max(200).nullable().optional(),
  telegramChannelUrl: z.string().url().max(200).nullable().optional(),
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

- [ ] **Step 4: Rewrite `getBySlug` + wire the module.** In `realtor-public.module.ts` add `AgentModule` to `imports` (it exports `SubscriptionService`; no cycle — do NOT use `forwardRef`). In `realtor-public.service.ts` inject `SubscriptionService` and rewrite `getBySlug` — the reduced payload must include EVERY `PublicRealtorSchema` key:

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
  if (!siteActive) {
    return { name, agency: profile.agency, verified: profile.verified, siteActive: false,
      bio: null, regions: [], experienceYears: null, logoUrl: null, brandColor: null,
      coverImageUrl: null, tagline: null, contactPhone: null, contactTelegram: null,
      contactWhatsapp: null, instagramUrl: null, telegramChannelUrl: null,
      ratingAvg: null, ratingCount: 0, listings: [], reviews: [] };
  }
  const rows = await this.prisma.listing.findMany({
    where: { ownerId: profile.userId, status: 'PUBLISHED' },
    include: FULL_INCLUDE, orderBy: { listedAt: 'desc' } });
  const listings = rows.map(toListingSummary);
  // ...existing APPROVED reviews query unchanged...
  return { name, agency: profile.agency, bio: profile.bio, regions: profile.regions,
    experienceYears: profile.experienceYears, logoUrl: profile.logoUrl, brandColor: profile.brandColor,
    coverImageUrl: profile.coverImageUrl, tagline: profile.tagline, contactPhone: profile.contactPhone,
    contactTelegram: profile.contactTelegram, contactWhatsapp: profile.contactWhatsapp,
    instagramUrl: profile.instagramUrl, telegramChannelUrl: profile.telegramChannelUrl,
    verified: profile.verified, ratingCount: profile.ratingCount,
    ratingAvg: profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null,
    siteActive: true, reviews, listings };
}
```

- [ ] **Step 5: Update `profile.service.ts` get/update.** `get()` enumerates its return object — add every new read field with a default (`sitePublished: p?.sitePublished ?? true`, the rest `?? null`). `update()`'s upsert `create:` branch also enumerates — add every new field there (so a first-ever PATCH doesn't drop them); canonicalize phones before the upsert:

```ts
// get() return — append:
    coverImageUrl: p?.coverImageUrl ?? null, tagline: p?.tagline ?? null,
    contactPhone: p?.contactPhone ?? null, contactTelegram: p?.contactTelegram ?? null,
    contactWhatsapp: p?.contactWhatsapp ?? null, instagramUrl: p?.instagramUrl ?? null,
    telegramChannelUrl: p?.telegramChannelUrl ?? null, seoTitle: p?.seoTitle ?? null,
    seoDescription: p?.seoDescription ?? null, sitePublished: p?.sitePublished ?? true,
// update() — before the upsert, canonicalize:
  if (typeof data.contactPhone === 'string') data.contactPhone = canonicalizePhone(data.contactPhone);
  if (typeof data.contactWhatsapp === 'string') data.contactWhatsapp = canonicalizePhone(data.contactWhatsapp);
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

- [ ] **Step 2: Rewrite `RealtorPage`** — all catalogue hooks BEFORE the early returns (Rules of Hooks); district facet layered locally; theme root; hero header; `siteActive` placeholder; reused filter stack. Use the full component from the spec sketch (the `apps/web/src/pages/realtor/ui/realtor-page.tsx` block in the Phase 9 brief): imports (`useMemo`/`useState`, `ListingCard`, the `@/features/listing-filters` set, `useInfiniteScroll`, `cn`, `Icon`, `ApiError`, `NotFoundView`, `realtorQuery`, `brandThemeVars`); `PAGE_SIZE = 8`; `criteria`/`district`/`limit` state; `districts` memo; `scoped`→`filterListings`→`shown`/`hasMore`/`sentinelRef`; `applyCriteria`/`patch`/`pickDistrict` (each resets `limit`); the `<main style={themeStyle} className="… md:max-w-none desk:max-w-none">`; the cover/`--brand` hero; the catalogue `<section>` (SortSelect, ListingFacets, district chip rail, search input, `<details>`+FilterPanel, `ListingCard` grid `md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4`, sentinel); `<ReviewsSection>`. **Keep `PageSkeleton` + `ReviewsSection` in the file unchanged.** No `favoriteSlot` (public page). Placeholder branch when `!data.siteActive`. (Full code is in the spec's Section 3 sketch — transcribe it verbatim.)

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

- [ ] **Step 2: Create `contact-section.tsx`** — a `ContactSection` rendering only the opt-in fields present: call (`tel:+${contactPhone}`), Telegram (`https://t.me/${contactTelegram}`), WhatsApp (`https://wa.me/${contactWhatsapp}`), Instagram/Telegram-channel links; and a "Qo'ng'iroq so'rash" form (name, phone, message; optional hidden `listingId`) using `useMutation` over `submitInquiry`, showing a success state ("So'rovingiz yuborildi") and error/loading. All accent styling reads `bg-accent`/`text-accent`/`var(--brand)` so it auto-rebrands. Uzbek labels.

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
- Produces: `POST /api/agent/profile/cover` + `useSaveCover()`; `coverImageUrl` stored as `imageVariantSrc(base, 1200)` (a 1200-wide WebP that `makeOg: true` pairs with `og.jpg` for Task 6).

- [ ] **Step 1: `setCover` + controller route.** In `profile.service.ts` add `setCover(userId, file)` mirroring `setLogo` but `makeOg: true` and `listingId: \`cover-${userId}\``, storing `coverImageUrl = imageVariantSrc(result.base, IMAGE_MAX_WIDTH)` via an upsert (`create: { userId, agency: '', coverImageUrl }`), returning `this.get(userId)`. In `profile-logo.controller.ts`add`@Post('cover')`mirroring`uploadLogo`(same`FileInterceptor`/mime/size guards). (Full code in the spec's Section 5 sketch.)

- [ ] **Step 2: `useSaveCover` hook + barrel export.** In `use-profile.ts` add `useSaveCover()` mirroring `useSaveLogo` (`apiUpload('/api/agent/profile/cover', formData, RealtorProfileSchema)`, `setQueryData(PROFILE_QUERY_KEY)` + invalidate). Export it from `features/profile/index.ts`.

- [ ] **Step 3: Editor form fields.** In `profile-page.tsx` add state for the 8 editable fields + `sitePublished` (seeded once in the existing `seeded` effect); add each to the changed-fields `patch` builder (canonicalize phones; strip a leading `@` from Telegram; empty string → `null`; client-side URL validation before `mutate`); a cover-upload input (`handleCoverChange` mirroring `handleLogoChange` → `saveCover.mutate(file)`); a `sitePublished` toggle button (`aria-pressed`, `markDirty()`); and a `siteLive = profile.sitePublished && !!subscription?.isActive` badge next to the `/r/:slug` link. (Full wiring in the spec's Section 5 sketch.)

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

- [ ] **Step 1: `getSiteMeta`** in `realtor-public.service.ts` — computes `siteActive`, and when active counts listings + fetches the first listing's position-1 `ogUrl`; returns `RealtorSiteMeta` (bio/logo/cover/seo/regions nulled/empty when inactive; `seoTitle`/`seoDescription` are here — server-only). (Full code in the spec's Section 6 sketch.)

- [ ] **Step 2: `meta.ts`** — add `interface RealtorSiteMeta`, a `jsonLdScript()` helper (unicode-escape `<`/`>`/`&` — NOT `escapeHtml`, which corrupts JSON), `buildRealtorJsonLd()` (`RealEstateAgent` type, `aggregateRating` when reviews exist), and rewrite `buildRealtorMetaTags(site, slug, baseUrl)`: minimal `noindex` head when `!site.siteActive`; else `seoTitle`/`seoDescription` overrides → derived fallbacks, `og:site_name` = agency, OG image = `coverImageUrl ?? logoUrl ?? firstListingImageOgUrl`, + the JSON-LD entry. (Full code in the spec's Section 7 sketch.)

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

## Decomposition note

Phase 9.1 (this plan), 7 tasks, contract-first. The standard flow: spec → plan → multi-lens critique → SDD per-task review → whole-branch review → live smoke (anon `/r/aziz-rieltor` at 375/1200/1440: branded catalogue, filters, contact + inquiry → lead in `/leads`; paused-site placeholder; SEO/OG view-source) → merge on explicit authorization → memory update. Custom domain + XML feed/embeddable widget = Phase 9.2.
