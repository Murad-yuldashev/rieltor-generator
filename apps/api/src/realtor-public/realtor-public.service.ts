import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canonicalizePhone,
  imageVariantSrc,
  type PublicRealtor,
  type RealtorInquiryCreate,
} from '@rieltor/shared';
import { SubscriptionService } from '../agent/subscription.service';
import { computeLeadScore, priceForScore } from '../leads/lead-scoring';
import { FULL_INCLUDE } from '../listings/listings.service';
import { toListingSummary } from '../listings/mapper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { escapeHtml, type RealtorSiteMeta } from '../ssr/meta';

@Injectable()
export class RealtorPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionService,
    private readonly notifications: NotificationsService,
  ) {}

  // In-process rate limit for the public inquiry endpoint — one submission per
  // [ip, slug] per RL_WINDOW_MS. Same shape as views.service: JSON.stringify the key
  // (a spoofed X-Forwarded-For ip may contain the separator) and prune lazily once the
  // map grows past RL_MAX_KEYS, so memory stays bounded without a background timer.
  private readonly inquiryHits = new Map<string, number>();
  private static readonly RL_WINDOW_MS = 60_000;
  private static readonly RL_MAX_KEYS = 10_000;

  // PUBLIC and slug-gated — NOT subscription-gated for identity/ratings. A lapsed
  // subscription (or an unpublished site) reduces the payload to identity + public
  // ratings/reviews, but never 402/404s the microsite; only an unknown slug 404s.
  async getBySlug(slug: string): Promise<PublicRealtor> {
    const profile = await this.prisma.realtorProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            subscription: { select: { status: true, currentPeriodEnd: true } },
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException(); // ONLY an unknown slug 404s.
    }

    const siteActive = this.isSiteActive(profile);
    const name = profile.user.name ?? 'Rieltor';

    // Ratings + APPROVED reviews are PUBLIC (not subscription-gated) and ALSO power
    // the agent cabinet "Baholarim" panel (use-my-rating.ts), which reads this same
    // endpoint. Compute/return them BEFORE the siteActive branch so a paused site
    // still surfaces the real ratings buyers saw — only the catalogue/branding is gated.
    const ratingAvg = profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null;

    // APPROVED reviews only, newest first. authorId is never selected/leaked.
    const reviewRows = await this.prisma.review.findMany({
      where: { realtorId: profile.userId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true, photoUrl: true } },
      },
    });
    const reviews = reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      authorName: r.author.name ?? 'Foydalanuvchi',
      authorPhotoUrl: r.author.photoUrl,
      createdAt: r.createdAt.toISOString(),
    }));

    if (!siteActive) {
      // Reduced payload — every PublicRealtorSchema key present; catalogue/branding
      // zeroed, but identity + public ratings/reviews kept real.
      return {
        name,
        agency: profile.agency,
        verified: profile.verified,
        siteActive: false,
        bio: null,
        regions: [],
        experienceYears: null,
        logoUrl: null,
        brandColor: null,
        coverImageUrl: null,
        tagline: null,
        contactPhone: null,
        contactTelegram: null,
        contactWhatsapp: null,
        instagramUrl: null,
        telegramChannelUrl: null,
        ratingAvg,
        ratingCount: profile.ratingCount,
        listings: [],
        reviews,
      };
    }

    const rows = await this.prisma.listing.findMany({
      where: { ownerId: profile.userId, status: 'PUBLISHED' },
      include: FULL_INCLUDE,
      orderBy: { listedAt: 'desc' },
    });
    const listings = rows.map(toListingSummary);

    // Client-facing shape only — no userId/slug or other internal fields leak.
    return {
      name,
      agency: profile.agency,
      bio: profile.bio,
      regions: profile.regions,
      experienceYears: profile.experienceYears,
      logoUrl: profile.logoUrl,
      brandColor: profile.brandColor,
      coverImageUrl: profile.coverImageUrl,
      tagline: profile.tagline,
      contactPhone: profile.contactPhone,
      contactTelegram: profile.contactTelegram,
      contactWhatsapp: profile.contactWhatsapp,
      instagramUrl: profile.instagramUrl,
      telegramChannelUrl: profile.telegramChannelUrl,
      verified: profile.verified,
      ratingCount: profile.ratingCount,
      ratingAvg,
      siteActive: true,
      reviews,
      listings,
    };
  }

  // SERVER-ONLY (no HTTP route) — feeds the SSR <head> for /r/:slug via
  // buildRealtorMetaTags. Same siteActive gate as getBySlug: ONLY an unknown slug
  // 404s; a known-but-paused slug returns { siteActive: false, … } so the caller can
  // emit a minimal noindex head @200 (never a 404 for a real realtor). seoTitle /
  // seoDescription live HERE (server-only) — they are NOT part of PublicRealtor.
  async getSiteMeta(slug: string): Promise<RealtorSiteMeta> {
    const profile = await this.prisma.realtorProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            subscription: { select: { status: true, currentPeriodEnd: true } },
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException(); // ONLY an unknown slug 404s.
    }

    const siteActive = this.isSiteActive(profile);

    // Only pay for the catalogue count + first cover (the OG image fallback) when the
    // site is live; a paused site emits the minimal noindex head and needs neither.
    let listingCount = 0;
    let firstListingImageOgUrl: string | null = null;
    if (siteActive) {
      listingCount = await this.prisma.listing.count({
        where: { ownerId: profile.userId, status: 'PUBLISHED' },
      });
      const first = await this.prisma.listing.findFirst({
        where: { ownerId: profile.userId, status: 'PUBLISHED' },
        orderBy: { listedAt: 'desc' },
        select: { images: { where: { position: 1 }, select: { ogUrl: true }, take: 1 } },
      });
      firstListingImageOgUrl = first?.images[0]?.ogUrl ?? null;
    }

    return {
      name: profile.user.name ?? 'Rieltor',
      agency: profile.agency,
      bio: siteActive ? profile.bio : null,
      logoUrl: siteActive ? profile.logoUrl : null,
      coverImageUrl: siteActive ? profile.coverImageUrl : null,
      seoTitle: siteActive ? profile.seoTitle : null,
      seoDescription: siteActive ? profile.seoDescription : null,
      listingCount,
      firstListingImageOgUrl,
      regions: siteActive ? profile.regions : [],
      ratingAvg: profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null,
      ratingCount: profile.ratingCount,
      siteActive,
    };
  }

  /**
   * The <script>-tag payload for GET /api/r/:slug/widget.js. When an external site
   * includes it, it injects a full-width, auto-height iframe pointing at the embed
   * page on the platform origin (PUBLIC_BASE_URL — a SERVER-trusted value, never the
   * request Host, so a spoofed/poisoned Host can't repoint the iframe at an attacker
   * origin), and resizes on the embed's `rieltor-embed-height` postMessage. slug +
   * origin are JSON-encoded so neither can break out of the JS string. No deps.
   */
  buildWidgetScript(slug: string, origin: string): string {
    const src = JSON.stringify(`${origin}/r/${slug}/embed`);
    return `(function(){
  var d=document,s=d.currentScript;
  if(!s)return;
  var f=d.createElement('iframe');
  f.src=${src};
  f.title='Rieltor katalog';
  f.loading='lazy';
  f.style.width='100%';f.style.border='0';f.style.height='640px';
  s.parentNode.insertBefore(f,s);
  window.addEventListener('message',function(e){
    if(e.source===f.contentWindow&&e.data&&e.data.type==='rieltor-embed-height'&&typeof e.data.height==='number'){
      f.style.height=e.data.height+'px';
    }
  });
})();`;
  }

  // PUBLIC: a site visitor's inquiry. Gated on the SAME siteActive computation as
  // getBySlug (active REALTOR subscription + published site) — a lapsed/paused site
  // rejects new leads with 403. Upserts the visitor by phone, then writes a
  // realtor-attributed CLAIMED lead so it lands in the realtor's existing /leads
  // cabinet, and notifies the realtor. Returns only { ok: true } — no internal ids leak.
  async createInquiry(slug: string, ip: string, body: RealtorInquiryCreate): Promise<{ ok: true }> {
    const key = JSON.stringify([ip, slug]);
    const now = Date.now();
    const last = this.inquiryHits.get(key);
    if (last !== undefined && now - last < RealtorPublicService.RL_WINDOW_MS) {
      throw new HttpException(
        "Juda ko'p so'rov, birozdan keyin urinib ko'ring",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (this.inquiryHits.size >= RealtorPublicService.RL_MAX_KEYS) {
      for (const [k, t] of this.inquiryHits) {
        if (now - t >= RealtorPublicService.RL_WINDOW_MS) this.inquiryHits.delete(k);
      }
    }
    this.inquiryHits.set(key, now);

    const profile = await this.prisma.realtorProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            role: true,
            subscription: { select: { status: true, currentPeriodEnd: true } },
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException();
    }
    const siteActive = this.isSiteActive(profile);
    if (!siteActive) {
      throw new ForbiddenException('Sayt faol emas');
    }

    // Only honor a listingId that is THIS realtor's own PUBLISHED listing; otherwise
    // it's a general inquiry and the deal falls back to the body's deal (default SALE).
    let deal = body.deal ?? 'SALE';
    let listingTag = '';
    if (body.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: body.listingId, ownerId: profile.userId, status: 'PUBLISHED' },
        select: { deal: true, title: true },
      });
      if (listing) {
        deal = listing.deal;
        listingTag = ` — ${listing.title}`;
      }
    }

    // Upsert the visitor by phone — a no-op update keeps an existing account intact.
    const phone = canonicalizePhone(body.phone);
    const visitor = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: body.name },
    });
    const createdAt = new Date();
    const score = computeLeadScore({
      district: null,
      type: null,
      roomsMin: null,
      areaMinM2: null,
      note: body.message,
      priceMaxSom: null,
      createdAt,
    });
    const lead = await this.prisma.propertyRequest.create({
      data: {
        authorId: visitor.id,
        claimedById: profile.userId,
        claimedAt: createdAt,
        status: 'CLAIMED',
        outcomeStage: 'NEW',
        deal,
        note: `[Sayt so'rovi]${listingTag}: ${body.message}`,
        score,
        priceSom: priceForScore(score),
      },
      select: { id: true },
    });
    await this.notifications.notify(profile.userId, {
      type: 'LEAD_INQUIRY',
      title: "Yangi so'rov",
      body: `${body.name}${listingTag}`,
      targetId: lead.id,
    });
    return { ok: true };
  }

  /**
   * The Phase-9 site gate — an active REALTOR subscription + a published site —
   * previously inlined in getBySlug / getSiteMeta / createInquiry. Extract it here
   * and reuse it at all four call sites (including getFeed below) so the rule lives
   * once. `Parameters<…isActive>[0]` types the subscription exactly as isActive expects.
   */
  private isSiteActive(profile: {
    sitePublished: boolean;
    user: { role: string; subscription: Parameters<SubscriptionService['isActive']>[0] };
  }): boolean {
    return (
      profile.user.role === 'REALTOR' &&
      this.subscriptions.isActive(profile.user.subscription) &&
      profile.sitePublished
    );
  }

  /**
   * Yandex Realty YML feed of the realtor's PUBLISHED listings (GET
   * /api/r/:slug/feed.xml). Same siteActive gate as the microsite, but a paused or
   * unknown slug 404s (a portal should stop syndicating a dark site). Listing <url>
   * points at the realtor's verified custom domain when set, else PUBLIC_BASE_URL;
   * image URLs always use PUBLIC_BASE_URL (the platform serves /images). Prices are
   * BigInt → string (never Number()).
   */
  async getFeed(slug: string, publicBaseUrl: string): Promise<string> {
    const profile = await this.prisma.realtorProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            role: true,
            subscription: { select: { status: true, currentPeriodEnd: true } },
          },
        },
      },
    });
    if (!profile || !this.isSiteActive(profile)) {
      throw new NotFoundException(); // unknown or paused slug → stop syndicating.
    }

    const siteBase =
      profile.customDomain && profile.customDomainVerified
        ? `https://${profile.customDomain}`
        : publicBaseUrl;

    const rows = await this.prisma.listing.findMany({
      where: { ownerId: profile.userId, status: 'PUBLISHED' },
      include: { images: { orderBy: { position: 'asc' } } },
      orderBy: { listedAt: 'desc' },
    });

    const esc = escapeHtml;
    // The Cyrillic literals below (deal type, category, unit "кв.м") are Yandex Realty
    // YML schema values — external-schema data, NOT translatable UI copy; leave as-is.
    const categoryOf = (type: string): string =>
      type === 'HOUSE' ? 'дом' : type === 'COMMERCIAL' ? 'коммерческая' : 'квартира';

    const offers = rows
      .map((r) => {
        const images = r.images
          .map(
            (img) =>
              `      <image>${esc(`${publicBaseUrl}${imageVariantSrc(img.base, 1200)}`)}</image>`,
          )
          .join('\n');
        const rentPeriod = r.deal === 'RENT' ? '\n        <period>месяц</period>' : '';
        const rooms = r.rooms != null ? `\n      <rooms>${r.rooms}</rooms>` : '';
        const floor = r.floor ? `\n      <floor>${esc(r.floor)}</floor>` : '';
        const coords =
          r.latitude != null && r.longitude != null
            ? `\n        <latitude>${r.latitude}</latitude>\n        <longitude>${r.longitude}</longitude>`
            : '';
        return `    <offer internal-id="${esc(r.id)}">
      <type>${r.deal === 'RENT' ? 'аренда' : 'продажа'}</type>
      <property-type>${r.type === 'COMMERCIAL' ? 'коммерческая' : 'жилая'}</property-type>
      <category>${categoryOf(r.type)}</category>
      <url>${esc(`${siteBase}/obj/${r.id}`)}</url>
      <creation-date>${r.listedAt.toISOString()}</creation-date>
      <location>
        <country>Узбекистан</country>
        <locality-name>${esc(r.district)}</locality-name>
        <address>${esc(r.landmark)}</address>${coords}
      </location>
      <price>
        <value>${r.priceSom}</value>
        <currency>UZS</currency>${rentPeriod}
      </price>
      <area>
        <value>${r.areaM2}</value>
        <unit>кв.м</unit>
      </area>${rooms}${floor}
${images}
      <description>${esc(r.description)}</description>
    </offer>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<realty-feed xmlns="http://webmaster.yandex.ru/schemas/feed/realty/2010-06">
  <generation-date>${new Date().toISOString()}</generation-date>
${offers}
</realty-feed>
`;
  }
}
