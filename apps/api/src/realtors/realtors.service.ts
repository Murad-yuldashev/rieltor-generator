import { Injectable } from '@nestjs/common';
import type { RealtorProfile, RealtorProfileUpdate } from '@rieltor/shared';
import { REALTOR_SELECT } from '../auth/realtor-select';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorsService {
  constructor(private readonly prisma: PrismaService) {}

  profile(realtorId: string): Promise<RealtorProfile> {
    return this.prisma.realtor.findUniqueOrThrow({
      where: { id: realtorId },
      select: REALTOR_SELECT,
    });
  }

  /**
   * Only the keys the request actually sent are written, so a form that submits
   * one field cannot blank the rest.
   */
  updateProfile(realtorId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    return this.prisma.realtor.update({
      where: { id: realtorId },
      data: patch,
      select: REALTOR_SELECT,
    });
  }
}
