import { resolve } from 'node:path';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IMAGE_MAX_WIDTH, imageVariantSrc } from '@rieltor/shared';
import type { RealtorProfile, RealtorProfileUpdate } from '@rieltor/shared';
import { processImage } from '../listings/process-image';
import { PrismaService } from '../prisma/prisma.service';

// Slugs that would shadow a first-class marketplace route (/search, /new, /r,
// /favorites, ...) — a realtor must not claim one, or their microsite would
// collide with a real page. Matched case-insensitively against the lowercased slug.
const RESERVED_SLUGS = new Set([
  'search',
  'new',
  'obj',
  'p',
  'r',
  'favorites',
  'contact',
  'offer',
  'api',
  'agent',
  'my',
  'requests',
  'valuation',
  'notifications',
]);

// Same static root bootstrap.ts serves '/images' from — resolved the same way as
// ListingsService.PUBLIC_DIR (relative to the API root, not this file post-compile).
const PUBLIC_DIR = resolve(__dirname, '..', '..', 'public');

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<RealtorProfile> {
    const p = await this.prisma.realtorProfile.findUnique({ where: { userId } });
    return {
      agency: p?.agency ?? '',
      bio: p?.bio ?? null,
      regions: p?.regions ?? [],
      experienceYears: p?.experienceYears ?? null,
      slug: p?.slug ?? null,
      verified: p?.verified ?? false,
      logoUrl: p?.logoUrl ?? null,
      brandColor: p?.brandColor ?? null,
    };
  }

  async update(userId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    const data: RealtorProfileUpdate = { ...patch };

    // Semantic slug checks (the schema already enforced the format at the
    // controller). null is allowed — it clears/unpublishes the slug.
    if (typeof data.slug === 'string') {
      data.slug = data.slug.toLowerCase();
      if (RESERVED_SLUGS.has(data.slug)) {
        throw new BadRequestException('Bu manzil band');
      }
    }

    try {
      await this.prisma.realtorProfile.upsert({
        where: { userId },
        update: { ...data },
        create: {
          userId,
          agency: data.agency ?? '',
          bio: data.bio ?? null,
          regions: data.regions ?? [],
          experienceYears: data.experienceYears ?? null,
          slug: data.slug ?? null,
          brandColor: data.brandColor ?? null,
        },
      });
    } catch (err) {
      // The @unique on RealtorProfile.slug rejects a slug already taken by
      // another realtor with P2002.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Bu manzil allaqachon olingan');
      }
      throw err;
    }

    return this.get(userId);
  }

  /**
   * Store a single brand logo. Reuses the listing image pipeline (processImage +
   * PUBLIC_DIR) so logos produce the same variants; the folder is keyed by user
   * (position 1), so a reupload overwrites the previous logo in place. No listing
   * Image row is created — a logo is just a file whose URL lands in logoUrl.
   */
  async setLogo(userId: string, file: Express.Multer.File): Promise<RealtorProfile> {
    const result = await processImage({
      source: file.buffer,
      outputRoot: PUBLIC_DIR,
      listingId: `logo-${userId}`,
      position: 1,
      makeOg: false,
    });

    // logoUrl is consumed as a direct <img src> (mapper falls it into photoUrl),
    // so store a renderable variant — the largest WebP, which preserves logo
    // transparency the JPG fallback would flatten.
    const logoUrl = imageVariantSrc(result.base, IMAGE_MAX_WIDTH);

    // upsert, not update: becomeRealtor grants the role without creating a
    // RealtorProfile row, so a realtor may upload a logo before saving a profile.
    await this.prisma.realtorProfile.upsert({
      where: { userId },
      update: { logoUrl },
      create: { userId, agency: '', logoUrl },
    });

    return this.get(userId);
  }
}
