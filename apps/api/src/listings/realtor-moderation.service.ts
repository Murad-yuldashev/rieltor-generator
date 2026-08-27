import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModeratorRealtorRow } from '@rieltor/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorModerationService {
  constructor(private readonly prisma: PrismaService) {}

  // Newest first so freshly-onboarded realtors surface at the top of the queue.
  async list(): Promise<ModeratorRealtorRow[]> {
    const profiles = await this.prisma.realtorProfile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return profiles.map((p) => ({
      userId: p.userId,
      name: p.user.name ?? 'Rieltor',
      agency: p.agency,
      slug: p.slug,
      verified: p.verified,
    }));
  }

  // Flip the MODERATOR-set verified badge. userId is @unique on RealtorProfile.
  async setVerified(userId: string, verified: boolean): Promise<ModeratorRealtorRow> {
    try {
      const p = await this.prisma.realtorProfile.update({
        where: { userId },
        data: { verified },
        include: { user: { select: { name: true } } },
      });
      return {
        userId: p.userId,
        name: p.user.name ?? 'Rieltor',
        agency: p.agency,
        slug: p.slug,
        verified: p.verified,
      };
    } catch (err) {
      // P2025 = "record to update not found" — no realtor profile for this userId.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException();
      }
      throw err;
    }
  }
}
