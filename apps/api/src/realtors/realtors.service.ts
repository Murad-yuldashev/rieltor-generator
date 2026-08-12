import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { RealtorProfile, RealtorProfileUpdate, RealtorShowcase, SoldListing } from '@rieltor/shared';
import { REALTOR_SELECT } from '../auth/realtor-select';
import { listingInclude, toListingSummary } from '../listings/mapper';
import { PrismaService } from '../prisma/prisma.service';

/** Fields the public /r/:username card and its SSR meta tags need — nothing more. */
const SHOWCASE_SELECT = {
  id: true,
  username: true,
  name: true,
  photoUrl: true,
  agency: true,
  phone: true,
  registryNo: true,
  trusted: true,
  tgUsername: true,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** soldAt − publishedAt, in whole days, floored at 0 for any bad/legacy data. */
function daysBetween(publishedAt: Date, soldAt: Date): number {
  return Math.max(0, Math.round((soldAt.getTime() - publishedAt.getTime()) / DAY_MS));
}

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

  /**
   * GET /api/realtors/:username and the /r/:username SSR shell (design spec §9.1):
   * the public card plus the realtor's ACTIVE+RESERVED listings and, separately, the
   * SOLD+RENTED ones — kept visible on purpose as a trust signal (spec §5.3), each
   * carrying how many days the sale took.
   */
  async showcase(username: string): Promise<RealtorShowcase> {
    const realtor = await this.prisma.realtor.findUnique({
      where: { username },
      select: SHOWCASE_SELECT,
    });
    if (!realtor) throw new NotFoundException(`Rieltor topilmadi: ${username}`);

    const rows = await this.prisma.listing.findMany({
      where: { realtorId: realtor.id, status: { in: ['ACTIVE', 'RESERVED', 'SOLD', 'RENTED'] } },
      include: listingInclude(),
      orderBy: { id: 'desc' },
    });

    const listings = rows
      .filter((row) => row.status === 'ACTIVE' || row.status === 'RESERVED')
      .map(toListingSummary);

    const sold: SoldListing[] = [];
    for (const row of rows) {
      if (row.status !== 'SOLD' && row.status !== 'RENTED') continue;
      // Both are always set by the time a listing reaches SOLD/RENTED (only reachable
      // from ACTIVE/RESERVED, which themselves require publishedAt) — skipped instead
      // of crashing the whole showcase over one malformed row.
      if (!row.publishedAt || !row.soldAt) continue;
      sold.push({
        ...toListingSummary(row),
        status: row.status,
        soldInDays: daysBetween(row.publishedAt, row.soldAt),
      });
    }

    return {
      id: realtor.id,
      username: realtor.username,
      name: realtor.name,
      photoUrl: realtor.photoUrl,
      agency: realtor.agency,
      phone: realtor.phone,
      telegram: realtor.tgUsername ? `https://t.me/${realtor.tgUsername}` : null,
      registryNo: realtor.registryNo,
      trusted: realtor.trusted,
      listings,
      sold,
    };
  }
}
