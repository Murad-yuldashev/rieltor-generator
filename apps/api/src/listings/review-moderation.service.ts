import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModeratorReviewRow } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewModerationService {
  constructor(private readonly prisma: PrismaService) {}

  // The moderator's queue: every PENDING review, oldest first (FIFO — the longest
  // waiting submission surfaces at the top). Shape is trimmed to ModeratorReviewRow,
  // so nothing beyond id/names/rating/comment/createdAt ever leaves the API.
  async listPending(): Promise<ModeratorReviewRow[]> {
    const rows = await this.prisma.review.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true } },
        realtor: { select: { name: true, realtorProfile: { select: { slug: true } } } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      realtorName: r.realtor.name ?? 'Rieltor',
      realtorSlug: r.realtor.realtorProfile?.slug ?? null,
      authorName: r.author.name ?? 'Foydalanuvchi',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // Approve or reject a review, adjusting the cached RealtorProfile aggregate only on
  // the APPROVED-membership transition. This is aggregate-writer #2: it takes the SAME
  // RealtorProfile row lock as ReviewsService.submit (writer #1), so the two never
  // interleave their read-modify-write on ratingSum/ratingCount.
  async moderate(
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<{ id: string; status: string }> {
    return this.prisma.$transaction(async (tx) => {
      // First read is only to learn WHICH profile row to lock (we need realtorId).
      const pre = await tx.review.findUnique({ where: { id }, select: { realtorId: true } });
      if (!pre) {
        throw new NotFoundException();
      }
      // Same profile-row lock ReviewsService.submit takes — serialize aggregate writes
      // for this realtor. ${pre.realtorId} is parameterized by the tagged template.
      await tx.$queryRaw`SELECT 1 FROM "RealtorProfile" WHERE "userId" = ${pre.realtorId} FOR UPDATE`;
      // Re-read the status UNDER the lock: a concurrent submit-edit (which also holds
      // this lock) could have flipped APPROVED->PENDING between the first read and the
      // lock. Reading here guarantees the delta below matches reality.
      const review = await tx.review.findUnique({
        where: { id },
        select: { status: true, rating: true, realtorId: true },
      });
      if (!review) {
        throw new NotFoundException();
      }
      const wasApproved = review.status === 'APPROVED';
      const willApprove = status === 'APPROVED';
      if (wasApproved !== willApprove) {
        const sign = willApprove ? 1 : -1;
        await tx.realtorProfile.update({
          where: { userId: review.realtorId },
          data: {
            ratingSum: { increment: sign * review.rating },
            ratingCount: { increment: sign },
          },
        });
      }
      return tx.review.update({
        where: { id },
        data: { status },
        select: { id: true, status: true },
      });
    });
  }
}
