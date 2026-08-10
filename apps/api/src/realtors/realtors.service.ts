import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { RealtorProfile, RealtorProfileUpdate } from '@rieltor/shared';
import { REALTOR_SELECT } from '../auth/realtor-select';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorsService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(realtorId: string): Promise<RealtorProfile> {
    try {
      return await this.prisma.realtor.findUniqueOrThrow({
        where: { id: realtorId },
        select: REALTOR_SELECT,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        // The session cookie is still valid, but the realtor row is gone (an admin
        // deletion, a test cleanup) — treat it as an invalid session, not a crash.
        throw new UnauthorizedException('Sessiya haqiqiy emas');
      }
      throw error;
    }
  }

  /**
   * Only the keys the request actually sent are written, so a form that submits
   * one field cannot blank the rest.
   */
  async updateProfile(realtorId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    try {
      return await this.prisma.realtor.update({
        where: { id: realtorId },
        data: patch,
        select: REALTOR_SELECT,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new UnauthorizedException('Sessiya haqiqiy emas');
      }
      throw error;
    }
  }
}
