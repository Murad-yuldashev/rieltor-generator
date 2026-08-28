import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicRealtor } from '@rieltor/shared';
import { FULL_INCLUDE } from '../listings/listings.service';
import { toListingSummary } from '../listings/mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorPublicService {
  constructor(private readonly prisma: PrismaService) {}

  // PUBLIC and slug-gated — NOT subscription-gated. A lapsed subscription must
  // never 402/404 the microsite; only an unknown slug 404s.
  async getBySlug(slug: string): Promise<PublicRealtor> {
    const profile = await this.prisma.realtorProfile.findUnique({
      where: { slug },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!profile) {
      throw new NotFoundException();
    }

    const rows = await this.prisma.listing.findMany({
      where: { ownerId: profile.userId, status: 'PUBLISHED' },
      include: FULL_INCLUDE,
      orderBy: { listedAt: 'desc' },
    });
    const listings = rows.map(toListingSummary);

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

    // Client-facing shape only — no userId/slug or other internal fields leak.
    return {
      name: profile.user.name ?? 'Rieltor',
      agency: profile.agency,
      bio: profile.bio,
      regions: profile.regions,
      experienceYears: profile.experienceYears,
      logoUrl: profile.logoUrl,
      brandColor: profile.brandColor,
      verified: profile.verified,
      ratingCount: profile.ratingCount,
      ratingAvg: profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : null,
      reviews,
      listings,
    };
  }
}
