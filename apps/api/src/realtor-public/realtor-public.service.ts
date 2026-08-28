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
      listings,
    };
  }
}
