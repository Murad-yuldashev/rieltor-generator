# Phase 10 — AI Social Content (C11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a realtor turn one of their own PUBLISHED listings into ready-to-post social content — a branded Story (1080×1920) + square post (1080×1080) card rendered client-side, plus an Uzbek caption + hashtags — sharing a link that points back to their own site.

**Architecture:** The card is drawn in an HTML `<canvas>` in the agent cabinet (no server font dependency, live preview). A new `realtor-content` NestJS module exposes two endpoints — list the realtor's own PUBLISHED listings, and generate caption+hashtags+shareUrl (reusing the Phase-7.2c `GeminiService` + `ai-content.*` builders). No database changes, no new dependencies.

**Tech Stack:** apps/api NestJS 11 (new `realtor-content` module, Prisma read-only, reuse GeminiService); packages/shared Zod; apps/agent React 19 + React Router 7 + TanStack Query 5 + native Canvas 2D.

**Spec:** [docs/superpowers/specs/2026-09-23-phase-10-ai-social-content-design.md](../specs/2026-09-23-phase-10-ai-social-content-design.md)

## Global Constraints

- Code/identifiers/routes/comments **English**; UI copy + generated caption/hashtags **Uzbek**.
- **No new test files.** Verify each task with the root turbo command (never `yarn workspace <pkg> lint` — exit 127), plus the task's curl/browser smoke:
  - `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/api --filter=@rieltor/agent` (subset the `--filter`s to the packages the task touched).
- **No database migration** — reads listings + profile, generates on demand, persists nothing.
- **No new runtime dependencies** — native `<canvas>`; `GeminiService` already exists; `sharp` deliberately NOT used.
- **BigInt money as string** — `priceSom` crosses the wire as a string, formatted with `formatPriceSom(priceSom, deal)` (RENT → `/oy`); never `Number()` it.
- **`brandColor` is data → Canvas 2D only** (already `/^#[0-9a-fA-F]{6}$/`-validated on save); never into DOM/HTML/CSS. Caption/hashtags are text, never HTML.
- **Ownership + gating** — both endpoints are `@UseGuards(JwtGuard, RealtorGuard)`; the social endpoint additionally 404s a listing that is not the caller's own PUBLISHED listing (no cross-realtor/draft leak).
- **Same-origin images** — the card loads covers from `/images/…` (same origin as `/agent`) so the canvas is not tainted and `toBlob` works.
- **Routing** — the endpoints live on `@Controller('agent/content')` (→ `/api/agent/content/*`, distinct from `AgentController('agent')`); nothing added to `SPA_ROUTES`.
- Commit WITHOUT `--no-verify` (husky/prettier hook), or `yarn prettier --write` first. `apps/web` and `apps/crm` are not touched.

## Review Focus

No new unit tests are allowed, so each item below is pinned to its owning task's **live smoke** step (not a unit test):

- **Listing with no cover image** (`imageUrl === null`) → the card renders a brand-color background variant, never a blank/broken canvas. → Task 4 smoke.
- **Gemini unavailable** (no `GEMINI_API_KEY` / error) → the caption falls back to the Uzbek template (`ai:false`); the endpoint returns 200, never 500. → Task 3 smoke.
- **Non-owned or DRAFT listing id** on the social endpoint → 404 (never returns another realtor's or a draft listing's content). → Task 3 smoke.
- **RENT listing** → price shows `/oy` on both the card and in the caption. → Task 4 + Task 3 smoke.
- **shareUrl branch** — a realtor with a verified custom domain gets `https://<domain>/obj/:id`; without one, `${PUBLIC_BASE_URL}/r/:slug` (or `/obj/:id` when they have no slug). → Task 3 smoke.

---

## Task 1: Shared schema

**Files:**

- Modify: `packages/shared/src/schemas.ts` (after `AiContentResponseSchema` ~line 306; type exports ~line 1303)

**Interfaces:**

- Consumes: existing `DealSchema`, `ListingTypeSchema`, `AiContentResponseSchema`.
- Produces: `RealtorOwnListingSchema` + type `RealtorOwnListing`; `AiSocialContentSchema` + type `AiSocialContent`.

- [ ] **Step 1: Add the two schemas**

In `packages/shared/src/schemas.ts`, immediately after `AiContentResponseSchema` (the `{ ai, caption, hashtags }` object):

```ts
/** A realtor's own listing, shaped for the social-content card (Phase 10 / C11). */
export const RealtorOwnListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  priceSom: z.string(), // BigInt-as-string; RENT = per month
  deal: DealSchema,
  type: ListingTypeSchema,
  rooms: z.number().int().nullable(),
  areaM2: z.number(),
  district: z.string(),
  /** Same-origin 1200-wide cover variant, or null when the listing has no image. */
  imageUrl: z.string().nullable(),
});

/** The social-content generate result: AI (or template) caption/hashtags + the closed-loop share URL. */
export const AiSocialContentSchema = AiContentResponseSchema.extend({
  shareUrl: z.string(),
});
```

- [ ] **Step 2: Export the types**

Near the other realtor/AI type exports (~line 1303, beside `export type Deal = …`):

```ts
export type RealtorOwnListing = z.infer<typeof RealtorOwnListingSchema>;
export type AiSocialContent = z.infer<typeof AiSocialContentSchema>;
```

- [ ] **Step 3: Verify**

Run: `yarn turbo run typecheck build --filter=@rieltor/shared`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas.ts
git commit -m "feat(shared): RealtorOwnListing + AiSocialContent schemas (phase 10)"
```

---

## Task 2: `realtor-content` module + own-listings endpoint

**Files:**

- Create: `apps/api/src/realtor-content/realtor-content.module.ts`
- Create: `apps/api/src/realtor-content/realtor-content.service.ts`
- Create: `apps/api/src/realtor-content/realtor-content.controller.ts`
- Modify: `apps/api/src/app.module.ts` (register the module)

**Interfaces:**

- Consumes: `RealtorOwnListing` (Task 1), `imageVariantSrc` (@rieltor/shared), `PrismaService`, `RealtorGuard` (from `AgentModule`), `JwtGuard`, `CurrentUser`.
- Produces: `RealtorContentService.ownListings(userId): Promise<RealtorOwnListing[]>`; `GET /api/agent/content/listings`. Module imports `AgentModule` + `AiModule` (the latter for Task 3's `GeminiService`).

- [ ] **Step 1: Create the service**

`apps/api/src/realtor-content/realtor-content.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { imageVariantSrc, type RealtorOwnListing } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** The caller's own PUBLISHED listings, shaped for the social-content card. */
  async ownListings(userId: string): Promise<RealtorOwnListing[]> {
    const rows = await this.prisma.listing.findMany({
      where: { ownerId: userId, status: 'PUBLISHED' },
      orderBy: { listedAt: 'desc' },
      // Cover = the lowest-position image. Use orderBy asc + take 1 (the codebase idiom,
      // listings.service.ts:263) — NOT where:{position:1}: removeImage does not renumber, so
      // a listing whose position-1 photo was deleted would otherwise report "no cover".
      include: { images: { orderBy: { position: 'asc' }, take: 1, select: { base: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      priceSom: r.priceSom.toString(),
      deal: r.deal,
      type: r.type,
      rooms: r.rooms,
      areaM2: r.areaM2,
      district: r.district,
      imageUrl: r.images[0] ? imageVariantSrc(r.images[0].base, 1200) : null,
    }));
  }
}
```

- [ ] **Step 2: Create the controller**

`apps/api/src/realtor-content/realtor-content.controller.ts`:

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { RealtorGuard } from '../agent/realtor.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { RealtorContentService } from './realtor-content.service';

// Global prefix ('api') → /api/agent/content/*. Distinct subpath from AgentController('agent').
// Realtor-gated (paid marketing tool), mirroring AiContentController.
@ApiExcludeController()
@Controller('agent/content')
@UseGuards(JwtGuard, RealtorGuard)
export class RealtorContentController {
  constructor(private readonly content: RealtorContentService) {}

  @Get('listings')
  listings(@CurrentUser() user: { id: string; role: string }) {
    return this.content.ownListings(user.id);
  }
}
```

- [ ] **Step 3: Create the module**

`apps/api/src/realtor-content/realtor-content.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { RealtorContentController } from './realtor-content.controller';
import { RealtorContentService } from './realtor-content.service';

// AuthModule is REQUIRED — @UseGuards(JwtGuard) makes Nest instantiate JwtGuard in THIS
// module's context, and its JwtService dep is surfaced only by AuthModule (module imports
// are not transitive, so AgentModule/AiModule importing AuthModule does not help here).
// Omitting it is a runtime bootstrap crash ("can't resolve JwtGuard dependencies") that
// typecheck/build do NOT catch. AgentModule exports RealtorGuard; AiModule exports
// GeminiService (Task 3). PrismaModule/ConfigModule are @Global. No cycle: none import this.
@Module({
  imports: [AuthModule, AgentModule, AiModule],
  controllers: [RealtorContentController],
  providers: [RealtorContentService],
})
export class RealtorContentModule {}
```

- [ ] **Step 4: Register in AppModule**

In `apps/api/src/app.module.ts`, add the import (alphabetically, next to `RealtorPublicModule`) and the entry in the `@Module({ imports: [...] })` array:

```ts
import { RealtorContentModule } from './realtor-content/realtor-content.module';
```

and add `RealtorContentModule,` to the imports array (next to `RealtorPublicModule,`).

- [ ] **Step 5: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/api`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/realtor-content apps/api/src/app.module.ts
git commit -m "feat(realtor-content): module + own PUBLISHED listings endpoint (phase 10)"
```

---

## Task 3: Social-content generate endpoint

**Files:**

- Modify: `apps/api/src/realtor-content/realtor-content.service.ts` (add `generate`)
- Modify: `apps/api/src/realtor-content/realtor-content.controller.ts` (add `POST listings/:id/social`)

**Interfaces:**

- Consumes: `GeminiService` (from `AiModule`), `buildContentPrompt`/`parseContent` (`../ai/ai-content.parse`), `buildContentTemplate` (`../ai/ai-content.template`), `ConfigService` (`PUBLIC_BASE_URL`), `AiContentRequest` + `AiSocialContent` (@rieltor/shared).
- Produces: `RealtorContentService.generate(userId, listingId): Promise<AiSocialContent>`; `POST /api/agent/content/listings/:id/social`.

- [ ] **Step 1: Add `generate` to the service**

Add these imports to `realtor-content.service.ts`:

```ts
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiContentRequest, AiSocialContent } from '@rieltor/shared';
import type { Env } from '../config/env';
import { GeminiService } from '../ai/gemini.service';
import { buildContentTemplate } from '../ai/ai-content.template';
import { buildContentPrompt, parseContent } from '../ai/ai-content.parse';
```

Extend the constructor and add the method:

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Caption + hashtags (Gemini, template fallback) + the closed-loop share URL for the
   * realtor's OWN PUBLISHED listing. 404s a missing / non-owned / draft listing (no leak).
   */
  async generate(userId: string, listingId: string): Promise<AiSocialContent> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, ownerId: userId, status: 'PUBLISHED' },
      select: { id: true, type: true, deal: true, district: true, rooms: true, areaM2: true, priceSom: true },
    });
    if (!listing) throw new NotFoundException("E'lon topilmadi"); // double quotes — apostrophe in Uzbek

    const req: AiContentRequest = {
      type: listing.type,
      deal: listing.deal,
      district: listing.district,
      rooms: listing.rooms,
      areaM2: listing.areaM2,
      priceSom: listing.priceSom.toString(),
    };
    const template = buildContentTemplate(req);
    const raw = await this.gemini.generate(buildContentPrompt(req), { maxTokens: 400 });
    const base = parseContent(raw, template); // { ai, caption, hashtags }; never throws

    const profile = await this.prisma.realtorProfile.findUnique({
      where: { userId },
      select: { slug: true, customDomain: true, customDomainVerified: true },
    });
    const publicBaseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
    const shareUrl =
      profile?.customDomain && profile.customDomainVerified
        ? `https://${profile.customDomain}/obj/${listing.id}`
        : profile?.slug
          ? `${publicBaseUrl}/r/${profile.slug}`
          : `${publicBaseUrl}/obj/${listing.id}`;

    return { ...base, shareUrl };
  }
```

- [ ] **Step 2: Add the route**

In `realtor-content.controller.ts`, add `Param`, `Post` to the `@nestjs/common` import, then add:

```ts
  @Post('listings/:id/social')
  social(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.content.generate(user.id, id);
  }
```

- [ ] **Step 3: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/api`
Expected: PASS.

- [ ] **Step 4: Live smoke (curl)**

Dev API on :3100 against a seeded DB (NODE_ENV=development for devCode OTP), realtor token (`998900000003`):

```bash
# own listing → { ai, caption (Uzbek), hashtags, shareUrl } ; seed realtor has verified aziz-rieltor.uz
LID=$(curl -s localhost:3100/api/agent/content/listings -H "authorization: Bearer $TOK" | jq -r '.[0].id')
curl -s -X POST localhost:3100/api/agent/content/listings/$LID/social -H "authorization: Bearer $TOK" | jq '{ai,shareUrl,caption:(.caption[0:40])}'
#   → shareUrl like "https://aziz-rieltor.uz/obj/<id>" (verified custom domain branch)
# a listing the realtor does NOT own / a draft → 404
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3100/api/agent/content/listings/bx-002/social -H "authorization: Bearer $TOK"  # 404 (bx-002 not owned)
```

Expected: own listing returns the JSON (RENT listing's caption carries `so'm/oy`); a non-owned id → 404; when `GEMINI_API_KEY` is unset, `ai:false` with a template caption (no 500).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/realtor-content
git commit -m "feat(realtor-content): social-content generate endpoint + shareUrl (phase 10)"
```

---

## Task 4: `SocialCard` canvas unit (apps/agent)

**Files:**

- Create: `apps/agent/src/features/social-content/social-card.tsx`

**Interfaces:**

- Consumes: `RealtorOwnListing` + `formatPriceSom` (@rieltor/shared).
- Produces: `SocialCard` (forwardRef component) exposing `SocialCardHandle { download(filename): void }`; `type CardFormat = 'story' | 'post'`.

- [ ] **Step 1: Write the card**

`apps/agent/src/features/social-content/social-card.tsx`:

```tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { formatPriceSom, type RealtorOwnListing } from '@rieltor/shared';

export type CardFormat = 'story' | 'post';
const SIZES: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  post: { w: 1080, h: 1080 },
};
const TEAL = '#0d9488';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface SocialCardHandle {
  download: (filename: string) => void;
}

interface Props {
  listing: RealtorOwnListing;
  format: CardFormat;
  agency: string;
  realtorName: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  shareUrl: string;
}

/** Load an image, resolving null on absence/error (never rejects). Same-origin → no taint. */
function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function hostFrom(shareUrl: string): string {
  try {
    const u = new URL(shareUrl);
    return (u.host + u.pathname).replace(/\/$/, '');
  } catch {
    return shareUrl;
  }
}

export const SocialCard = forwardRef<SocialCardHandle, Props>(function SocialCard(props, ref) {
  const { listing, format, agency, realtorName, logoUrl, brandColor, shareUrl } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    download(filename) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      } catch {
        /* toBlob throws only on a tainted canvas; covers are same-origin so this is defensive (spec §5) */
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = SIZES[format];
    canvas.width = w;
    canvas.height = h;
    const brand = brandColor ?? TEAL;
    let cancelled = false;

    void Promise.all([loadImage(listing.imageUrl), loadImage(logoUrl)])
      .then(([cover, logo]) => {
        if (cancelled) return;
        // Background: cover-fit photo, or a solid brand fill when there is no cover.
        if (cover) {
          const scale = Math.max(w / cover.width, h / cover.height);
          const dw = cover.width * scale;
          const dh = cover.height * scale;
          ctx.drawImage(cover, (w - dw) / 2, (h - dh) / 2, dw, dh);
        } else {
          ctx.fillStyle = brand;
          ctx.fillRect(0, 0, w, h);
        }
        // Legibility gradient (bottom) + brand accent bar (top).
        const grad = ctx.createLinearGradient(0, h * 0.45, 0, h);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.78)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = brand;
        ctx.fillRect(0, 0, w, 18);

        // Header: logo (rounded) + agency/name, top-left.
        let hx = 56;
        if (logo) {
          const s = 104;
          ctx.save();
          ctx.beginPath();
          ctx.arc(56 + s / 2, 56 + s / 2, s / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logo, 56, 56, s, s);
          ctx.restore();
          hx = 56 + s + 24;
        }
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#fff';
        ctx.font = `bold 44px ${FONT}`;
        ctx.fillText(ellipsize(ctx, agency || 'Rieltor', w - hx - 56), hx, 64);
        if (realtorName) {
          ctx.font = `600 34px ${FONT}`;
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.fillText(ellipsize(ctx, realtorName, w - hx - 56), hx, 118);
        }

        // Footer block: price, params, site host pill.
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff';
        ctx.font = `bold 92px ${FONT}`;
        ctx.fillText(
          ellipsize(ctx, formatPriceSom(listing.priceSom, listing.deal), w - 112),
          56,
          h - 232,
        );

        const params = [
          listing.rooms != null ? `${listing.rooms} xona` : null,
          `${listing.areaM2} m²`,
          listing.district,
        ]
          .filter(Boolean)
          .join(' · ');
        ctx.font = `600 42px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillText(ellipsize(ctx, params, w - 112), 56, h - 160);

        const host = hostFrom(shareUrl);
        if (host) {
          // Only draw the pill once shareUrl has resolved — on the first (pending) render
          // shareUrl is '' and hostFrom('') is '' → skip, so no empty lozenge flashes.
          ctx.font = `bold 36px ${FONT}`;
          const pillW = Math.min(ctx.measureText(host).width + 56, w - 112);
          ctx.fillStyle = brand;
          ctx.beginPath();
          ctx.roundRect(56, h - 118, pillW, 64, 32);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillText(ellipsize(ctx, host, pillW - 56), 84, h - 74);
        }
      })
      .catch(() => {}); // loadImage never rejects; defensive so a draw error is never unhandled

    return () => {
      cancelled = true;
    };
  }, [listing, format, agency, realtorName, logoUrl, brandColor, shareUrl]);

  const { w, h } = SIZES[format];
  return (
    <canvas
      ref={canvasRef}
      aria-label="Ijtimoiy tarmoq kartasi"
      className="mx-auto block h-auto w-full rounded-[14px] border border-line"
      style={{ aspectRatio: `${w} / ${h}`, maxWidth: format === 'story' ? 300 : 400 }}
    />
  );
});
```

(`CanvasRenderingContext2D.roundRect` is standard in the Chromium/Vite target.)

- [ ] **Step 2: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/agent`
Expected: PASS.

- [ ] **Step 3: Live browser smoke (deferred with Task 5)**

The card has no standalone page yet; its rendering (cover-fit photo, RENT `/oy` price, params, logo _when the profile has one_, brand accent, host pill, and the no-cover brand-fill variant) is smoked through the Task 5 modal. Note this in the report.

- [ ] **Step 4: Commit**

```bash
git add apps/agent/src/features/social-content/social-card.tsx
git commit -m "feat(agent): SocialCard canvas unit — Story/post branded card (phase 10)"
```

---

## Task 5: "Mening e'lonlarim" page + modal + hooks + nav + route

**Files:**

- Create: `apps/agent/src/features/social-content/use-social-content.ts`
- Create: `apps/agent/src/features/social-content/index.ts`
- Create: `apps/agent/src/widgets/social-card-modal/ui/social-card-modal.tsx` (a **widget** — it imports the `profile`/`presentations`/`social-content` features; under the FSD `boundaries` rule a `features` element may import only `entities`/`shared`, so a feature cannot import another feature — a widget can)
- Create: `apps/agent/src/widgets/social-card-modal/index.ts`
- Create: `apps/agent/src/pages/my-listings/index.ts`
- Create: `apps/agent/src/pages/my-listings/ui/my-listings-page.tsx`
- Modify: `apps/agent/src/app/router.tsx` (add the route)
- Modify: `apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx` (add the nav entry)

**Interfaces:**

- Consumes: `SocialCard` + `SocialCardHandle` + `CardFormat` (Task 4); `RealtorOwnListing` + `RealtorOwnListingSchema` + `AiSocialContentSchema` + `formatPriceSom` (@rieltor/shared); `apiGet`/`apiPost` (`@/shared/api/client`); `useProfile` (`@/features/profile`); `useSession` (`@/entities/session`); `telegramShareUrl` (`@/features/presentations`).
- Produces: `useOwnListings()`, `useListingContent(listingId, enabled)`; `SocialCardModal` (widget); `MyListingsPage`; route `/my-listings`; a nav entry.

- [ ] **Step 1: Hooks**

`apps/agent/src/features/social-content/use-social-content.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AiSocialContentSchema, RealtorOwnListingSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

const OwnListingsSchema = z.array(RealtorOwnListingSchema);

/** `GET /api/agent/content/listings` → the realtor's own PUBLISHED listings for the card grid. */
export function useOwnListings() {
  return useQuery({
    queryKey: ['own-listings'] as const,
    queryFn: () => apiGet('/api/agent/content/listings', OwnListingsSchema),
    staleTime: 60 * 1000,
  });
}

/**
 * `POST /api/agent/content/listings/:id/social` → caption + hashtags + shareUrl. A per-listing
 * useQuery (NOT a mutation): keyed by listing id with `staleTime: Infinity`, so re-opening the same
 * listing serves from cache (never re-bills Gemini) and React Query dedupes the StrictMode
 * double-mount into ONE call. `enabled` is true only while the modal is open. (A POST queryFn is
 * fine here — the call is idempotent "generate", cached for the session.)
 */
export function useListingContent(listingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['social-content', listingId] as const,
    queryFn: () =>
      apiPost(`/api/agent/content/listings/${listingId}/social`, AiSocialContentSchema),
    enabled,
    staleTime: Infinity,
  });
}
```

`apps/agent/src/features/social-content/index.ts`:

```ts
export { useOwnListings, useListingContent } from './use-social-content';
export { SocialCard, type SocialCardHandle, type CardFormat } from './social-card';
```

- [ ] **Step 2: The modal (a widget)**

`apps/agent/src/widgets/social-card-modal/ui/social-card-modal.tsx` (a WIDGET, so it may import the `social-content`/`profile`/`presentations` features and the `session` entity):

```tsx
import { useRef, useState } from 'react';
import type { RealtorOwnListing } from '@rieltor/shared';
import {
  SocialCard,
  useListingContent,
  type CardFormat,
  type SocialCardHandle,
} from '@/features/social-content';
import { useProfile } from '@/features/profile';
import { useSession } from '@/entities/session';
import { telegramShareUrl } from '@/features/presentations';

export function SocialCardModal({
  listing,
  onClose,
}: {
  listing: RealtorOwnListing;
  onClose: () => void;
}) {
  const { data: profile } = useProfile();
  const { user } = useSession();
  // Per-listing query (fires on mount, deduped + cached — no useEffect, no double-POST).
  const { data: content, isPending, isError } = useListingContent(listing.id, true);
  const cardRef = useRef<SocialCardHandle>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [copied, setCopied] = useState(false);

  const captionBlock = content ? `${content.caption}\n\n${content.hashtags}` : '';
  const shareUrl = content?.shareUrl ?? '';
  const filename = `${profile?.slug ? `${profile.slug}-` : ''}${listing.id}-${format}.png`;

  const copyCaption = () => {
    if (!captionBlock) return;
    void navigator.clipboard
      ?.writeText(captionBlock)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-card bg-card p-4 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[15px] font-extrabold text-ink">Kontent yaratish</p>
          <button type="button" onClick={onClose} className="text-[13px] font-bold text-ink-3">
            Yopish
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(['story', 'post'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={
                format === f
                  ? 'rounded-[12px] bg-accent px-4 py-2 text-[13px] font-extrabold text-white'
                  : 'rounded-[12px] border border-line px-4 py-2 text-[13px] font-bold text-ink-2'
              }
            >
              {f === 'story' ? 'Story' : 'Post'}
            </button>
          ))}
        </div>

        <SocialCard
          ref={cardRef}
          listing={listing}
          format={format}
          agency={profile?.agency ?? ''}
          realtorName={user?.name ?? null}
          logoUrl={profile?.logoUrl ?? null}
          brandColor={profile?.brandColor ?? null}
          shareUrl={shareUrl}
        />

        <button
          type="button"
          onClick={() => cardRef.current?.download(filename)}
          className="mt-3 w-full rounded-[14px] bg-accent px-5 py-3 text-[14.5px] font-extrabold text-white"
        >
          Rasmni yuklab olish
        </button>

        <div className="mt-4">
          {isPending && <p className="text-[13px] text-ink-3">Matn tayyorlanmoqda…</p>}
          {isError && (
            <p className="text-[13px] font-semibold text-brand-rose">Matnni yuklab bo'lmadi.</p>
          )}
          {content && (
            <>
              <textarea
                readOnly
                value={captionBlock}
                rows={6}
                className="w-full resize-none rounded-[12px] border border-line bg-surface p-3 text-[13.5px]"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={copyCaption}
                  className="flex-1 rounded-[12px] border border-line px-4 py-2.5 text-[13px] font-bold text-ink-2"
                >
                  {copied ? 'Nusxalandi' : 'Matnni nusxalash'}
                </button>
                <a
                  href={telegramShareUrl(shareUrl, captionBlock)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-[12px] bg-accent px-4 py-2.5 text-center text-[13px] font-extrabold text-white"
                >
                  Telegram'da ulash
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

`apps/agent/src/widgets/social-card-modal/index.ts`:

```ts
export { SocialCardModal } from './ui/social-card-modal';
```

- [ ] **Step 3: The page**

`apps/agent/src/pages/my-listings/ui/my-listings-page.tsx`:

```tsx
import { useState } from 'react';
import { formatPriceSom, type RealtorOwnListing } from '@rieltor/shared';
import { useOwnListings } from '@/features/social-content';
import { SocialCardModal } from '@/widgets/social-card-modal';

export function MyListingsPage() {
  const { data: listings, isPending, isError } = useOwnListings();
  const [active, setActive] = useState<RealtorOwnListing | null>(null);

  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface p-4 md:max-w-none">
      <h1 className="mb-4 text-lg font-extrabold text-ink">Mening e'lonlarim</h1>

      {isPending && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-card bg-card" />
          ))}
        </div>
      )}
      {isError && <p className="font-semibold text-brand-rose">E'lonlarni yuklab bo'lmadi.</p>}
      {listings && listings.length === 0 && (
        <p className="rounded-card border border-line/60 bg-card px-4 py-10 text-center text-ink-2">
          Hali PUBLISHED e'loningiz yo'q. E'lon joylang — shu yerda kontent yaratasiz.
        </p>
      )}

      {listings && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4">
          {listings.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-card border border-line/60 bg-card">
              {l.imageUrl ? (
                <img
                  src={l.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-accent-soft" />
              )}
              <div className="p-3">
                <p className="truncate text-[14px] font-bold text-ink">{l.title}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-ink-2">
                  {formatPriceSom(l.priceSom, l.deal)}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-3">{l.district}</p>
                <button
                  type="button"
                  onClick={() => setActive(l)}
                  className="mt-3 w-full rounded-[12px] bg-accent px-4 py-2.5 text-[13px] font-extrabold text-white"
                >
                  Kontent yaratish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && <SocialCardModal listing={active} onClose={() => setActive(null)} />}
    </div>
  );
}
```

`apps/agent/src/pages/my-listings/index.ts`:

```ts
export { MyListingsPage } from './ui/my-listings-page';
```

- [ ] **Step 4: Route**

In `apps/agent/src/app/router.tsx`, import `MyListingsPage` and add a child route under the `CabinetShell` children (next to `browse`):

```tsx
{ path: 'my-listings', element: <MyListingsPage /> },
```

- [ ] **Step 5: Nav entry**

In `apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx`, add to the nav-items array (e.g. after the `browse` entry) — use the EXISTING `camera` glyph (do not invent an icon name):

```ts
{ to: '/my-listings', icon: 'camera', label: "Mening e'lonlarim" },
```

- [ ] **Step 6: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/agent`
Expected: PASS (watch for unused imports / a wrong `icon` name — the Phase-8.1 `name≠IconName` trap; `camera` is a real glyph).

- [ ] **Step 7: Live browser smoke**

Serve the agent bundle behind the dev API (:3100, seeded DB), log in as `998900000003`, open **Mening e'lonlarim**:

- The grid shows the realtor's 8 PUBLISHED listings (cover thumbs, price, district).
- "Kontent yaratish" opens the modal: the **card renders** with the cover photo (cover-fit), price (a RENT listing shows `/oy`), `xona · m² · tuman`, the agency (+ the logo only if the profile has a `logoUrl` — the seed realtor has none, so expect agency + brand accent and NO logo), brand-color (`#7c3aed`) accent, and the site host pill (`aziz-rieltor.uz`).
- **Story ↔ Post** toggle re-renders at 9:16 / 1:1.
- **Rasmni yuklab olish** saves a PNG.
- Caption + hashtags (AI or template) appear; **Matnni nusxalash** copies; **Telegram'da ulash** opens `t.me/share/url` with the shareUrl + caption.
- A listing whose cover is absent renders the brand-color background variant (verify on one without a photo, if any; otherwise confirm the `imageUrl===null` code path in review). 0 console errors.

- [ ] **Step 8: Commit**

```bash
git add apps/agent/src/features/social-content apps/agent/src/widgets/social-card-modal apps/agent/src/pages/my-listings apps/agent/src/app/router.tsx apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx
git commit -m "feat(agent): Mening e'lonlarim page + social-card modal + nav (phase 10)"
```

---

## Self-Review (completed while writing)

- **Spec coverage:** §1 shared → Task 1; §2 server (both endpoints + module) → Tasks 2–3; §3 canvas card → Task 4; §4 page/modal/hooks/nav → Task 5; §5 graceful degradation → Tasks 3 (AI fallback), 4 (no-cover, no-brand), 5 (loading/error/empty); §6 seed reuse + smoke → Tasks 3 + 5 smokes. No migration, no seed change (spec §6). All covered.
- **Type consistency:** `RealtorOwnListing` (Task 1) shape is produced by `ownListings` (Task 2), consumed by `SocialCard`/`MyListingsPage` (Tasks 4–5) and parsed by `OwnListingsSchema` (Task 5); `AiSocialContent` (Task 1) is returned by `generate` (Task 3) and parsed by `useListingContent` (Task 5); `SocialCardHandle`/`CardFormat` (Task 4) used by the modal (Task 5); `formatPriceSom(priceSom: string, deal)` used in Tasks 4–5; `imageVariantSrc(base, 1200)` (Task 2); `RealtorGuard`/`GeminiService`/`buildContentPrompt`/`parseContent`/`buildContentTemplate` reused with their real signatures.
- **Placeholder scan:** every code step is concrete; no TBD/TODO.
- **Review Focus:** the 5 items map to Task 3 (AI fallback, non-owned 404, RENT `/oy`, shareUrl branch) and Task 4/5 (no-cover variant, RENT price on card) live smokes — no unit tests possible under the no-new-test-files constraint.
- **Escaping note:** the caption/hashtags render only inside a `<textarea value>` and via canvas `fillText` — never as HTML; `brandColor` only reaches Canvas 2D fill/stroke.

## Critique fixes applied (multi-lens, before execution)

Three Opus critics (security, React/runtime, coverage) reviewed this plan; fixes folded in:

- **[MUST] `RealtorContentModule` missing `AuthModule`** — `@UseGuards(JwtGuard)` instantiates JwtGuard here and its `JwtService` is surfaced only by `AuthModule` (imports aren't transitive) → runtime bootstrap crash typecheck can't catch. Added `AuthModule` to the module imports (Task 2 Step 3).
- **[MUST] FSD `boundaries`: a feature can't import another feature** — the modal (imports `profile`/`presentations`) moved from `features/social-content` to a **widget** `widgets/social-card-modal` (Task 5); the page imports it from `@/widgets/social-card-modal`.
- **[MUST] `eslint-disable react-hooks/exhaustive-deps` fails the lint gate** (the rule/plugin isn't loaded → ESLint 9 errors) — removed by replacing the `useEffect(generate.mutate)` with a per-listing `useListingContent` **useQuery** (Task 5 Step 1), which also fixes the StrictMode double-POST and the paid-call re-bill on re-open (per-listing cache).
- **[MUST] `NotFoundException('E'lon topilmadi')`** — the apostrophe closed the single-quoted string (syntax error). Now double-quoted (Task 3).
- **[MUST] Cover lookup `where:{position:1}`** — a listing whose position-1 photo was deleted (no renumber) would mis-report "no cover". Switched to the codebase idiom `orderBy:{position:'asc'}, take:1` (Task 2).
- **[SHOULD] `toBlob` not wrapped** (spec §5) — the download's `toBlob` is now in try/catch; the draw promise has `.catch` (Task 4).
- **[SHOULD] Empty-shareUrl pill flash** — the host pill is drawn only when `hostFrom(shareUrl)` is non-empty (Task 4).
- **[SHOULD] Seed has no logo** — the smoke expectation now says the seed realtor has no `logoUrl`, so the card shows agency + brand accent WITHOUT a logo (the code omits it correctly).
- **[NIT] Download filename** now includes the slug (`<slug>-<id>-<format>.png`) per spec §3 (Task 5 modal); **loading** uses skeletons per spec §4 (Task 5 page).
- **Accepted (documented, no change):** shareUrl's slug-only branch targets `/r/:slug` (the attributed site catalogue, not the specific unit) — spec-intended and tenant-safe; the grid thumb reuses the 1200 variant (fine for ~8 listings); the DTO's `type` field is unused client-side (harmless).

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-23-phase-10-ai-social-content.md`. The established method for this project is **subagent-driven** (fresh implementer + reviewer per task, whole-branch review at the end); recommended here because the tasks hand typed interfaces to each other (shared schema → endpoints → card → page) and the social endpoint carries ownership/leak-safety worth an independent gate. Please review the plan; say **"boshla"** to execute via subagent-driven-development, or name another approach.
