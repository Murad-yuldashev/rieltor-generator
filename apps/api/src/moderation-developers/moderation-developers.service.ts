import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModeratorDeveloperRow } from '@rieltor/shared';
import { OrgRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Shared include so list() and setVerified() build the row from the same shape:
// the org's complex count and its OWNER membership's phone.
const orgInclude = {
  _count: { select: { complexes: true } },
  members: {
    where: { role: OrgRole.OWNER },
    include: { user: { select: { phone: true } } },
    take: 1,
  },
} satisfies Prisma.OrganizationInclude;

type OrgWithRow = Prisma.OrganizationGetPayload<{ include: typeof orgInclude }>;

@Injectable()
export class ModerationDevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  // Queue shows orgs that either requested verification or are already verified.
  // `verified: 'asc'` puts pending (false) before verified (true) — and since the
  // where-clause only admits verified=false rows that have a request, false === pending.
  // Newest first within each group.
  async list(): Promise<ModeratorDeveloperRow[]> {
    const orgs = await this.prisma.organization.findMany({
      where: { OR: [{ verificationRequestedAt: { not: null } }, { verified: true }] },
      include: orgInclude,
      orderBy: [{ verified: 'asc' }, { createdAt: 'desc' }],
    });
    return orgs.map((org) => this.toRow(org));
  }

  // Flip the moderator-set verified badge on an organization. orgId is the @id.
  async setVerified(
    orgId: string,
    verified: boolean,
    note?: string,
  ): Promise<ModeratorDeveloperRow> {
    try {
      const org = await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          verified,
          verifiedAt: verified ? new Date() : null,
          verificationNote: note ?? null,
        },
        include: orgInclude,
      });
      return this.toRow(org);
    } catch (err) {
      // P2025 = "record to update not found" — no organization for this orgId.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException();
      }
      throw err;
    }
  }

  private toRow(org: OrgWithRow): ModeratorDeveloperRow {
    return {
      orgId: org.id,
      name: org.name,
      district: org.district,
      verified: org.verified,
      verificationRequestedAt: org.verificationRequestedAt?.toISOString() ?? null,
      complexCount: org._count.complexes,
      memberPhone: org.members[0]?.user.phone ?? '',
    };
  }
}
