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
      const profile = await this.prisma.realtor.update({
        where: { id: realtorId },
        data: patch,
        select: REALTOR_SELECT,
      });
      // Keep the public Agent card in step with the profile the realtor just edited.
      await this.syncAgent(realtorId);
      return profile;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new UnauthorizedException('Sessiya haqiqiy emas');
      }
      throw error;
    }
  }

  /**
   * Mirrors the realtor's own profile into the public Agent row that a listing card
   * renders. Idempotent: the first call creates the Agent and links it via
   * Realtor.agentId; later calls update it in place. Called on profile edits and on
   * every listing creation, so Listing.agentId (NOT NULL) is always ready. Agent's
   * columns are NOT NULL, so fields the realtor has not filled yet fall back to
   * empty strings — invisible in public until publish, which requires a real phone
   * and re-runs this with it.
   */
  async syncAgent(realtorId: string): Promise<string> {
    const realtor = await this.prisma.realtor.findUniqueOrThrow({
      where: { id: realtorId },
      select: { agentId: true, name: true, agency: true, photoUrl: true, phone: true, tgUsername: true },
    });

    const data = {
      name: realtor.name,
      agency: realtor.agency ?? '',
      photoUrl: realtor.photoUrl ?? '',
      phone: realtor.phone ?? '',
      telegram: realtor.tgUsername ? `https://t.me/${realtor.tgUsername}` : '',
    };

    if (realtor.agentId) {
      await this.prisma.agent.update({ where: { id: realtor.agentId }, data });
      return realtor.agentId;
    }

    const agent = await this.prisma.agent.create({ data, select: { id: true } });
    await this.prisma.realtor.update({ where: { id: realtorId }, data: { agentId: agent.id } });
    return agent.id;
  }
}
