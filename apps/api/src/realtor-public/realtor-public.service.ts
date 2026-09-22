import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { canonicalizePhone, type PublicRealtor, type RealtorInquiryCreate } from '@rieltor/shared';
import { SubscriptionService } from '../agent/subscription.service';
import { computeLeadScore, priceForScore } from '../leads/lead-scoring';
import { FULL_INCLUDE } from '../listings/listings.service';
import { toListingSummary } from '../listings/mapper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

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
            id: true,
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

    const siteActive =
      profile.user.role === 'REALTOR' &&
      this.subscriptions.isActive(profile.user.subscription) &&
      profile.sitePublished;
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
            id: true,
            role: true,
            subscription: { select: { status: true, currentPeriodEnd: true } },
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException();
    }
    const siteActive =
      profile.user.role === 'REALTOR' &&
      this.subscriptions.isActive(profile.user.subscription) &&
      profile.sitePublished;
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
}
