import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicRealtor } from '@rieltor/shared';
import { SubscriptionService } from '../agent/subscription.service';
import { FULL_INCLUDE } from '../listings/listings.service';
import { toListingSummary } from '../listings/mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionService,
  ) {}

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
}
