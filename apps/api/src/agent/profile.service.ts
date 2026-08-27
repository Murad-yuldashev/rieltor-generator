import { Injectable } from '@nestjs/common';
import type { RealtorProfile, RealtorProfileUpdate } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

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
    };
  }

  async update(userId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    await this.prisma.realtorProfile.upsert({
      where: { userId },
      update: { ...patch },
      create: {
        userId,
        agency: patch.agency ?? '',
        bio: patch.bio ?? null,
        regions: patch.regions ?? [],
        experienceYears: patch.experienceYears ?? null,
      },
    });
    return this.get(userId);
  }
}
