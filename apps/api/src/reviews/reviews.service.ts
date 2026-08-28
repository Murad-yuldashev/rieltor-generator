import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MyReview, ReviewCreate } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Resolve the public slug to the realtor's User.id. Unknown slug 404s — a lapsed
  // subscription never blocks here (the microsite stays reachable).
  private async resolveRealtorId(slug: string): Promise<string> {
    const profile = await this.prisma.realtorProfile.findUnique({
      where: { slug },
      select: { userId: true },
    });
    if (!profile) {
      throw new NotFoundException();
    }
    return profile.userId;
  }

  // Upsert the author's review of a realtor. Every write resets status to PENDING,
  // so editing an already-APPROVED review pulls it back out of the public set —
  // this is aggregate-writer #1: it decrements the cached ratingSum/ratingCount.
  async submit(
    slug: string,
    authorId: string,
    { rating, comment }: ReviewCreate,
  ): Promise<MyReview> {
    const realtorId = await this.resolveRealtorId(slug);
    if (authorId === realtorId) {
      throw new BadRequestException("O'zingizga sharh qoldira olmaysiz");
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.review.findUnique({
        where: { realtorId_authorId: { realtorId, authorId } },
        select: { status: true, rating: true },
      });
      // Leaving the APPROVED set (an edit of an approved review) decrements the cache.
      if (existing?.status === 'APPROVED') {
        await tx.realtorProfile.update({
          where: { userId: realtorId },
          data: { ratingSum: { decrement: existing.rating }, ratingCount: { decrement: 1 } },
        });
      }
      const row = await tx.review.upsert({
        where: { realtorId_authorId: { realtorId, authorId } },
        create: { realtorId, authorId, rating, comment: comment ?? null, status: 'PENDING' },
        update: { rating, comment: comment ?? null, status: 'PENDING' },
        select: { rating: true, comment: true, status: true },
      });
      return row;
    });
  }

  // The caller's own review of this realtor, in any status — or null if none yet.
  async myReview(slug: string, authorId: string): Promise<MyReview | null> {
    const realtorId = await this.resolveRealtorId(slug);
    return this.prisma.review.findUnique({
      where: { realtorId_authorId: { realtorId, authorId } },
      select: { rating: true, comment: true, status: true },
    });
  }
}
