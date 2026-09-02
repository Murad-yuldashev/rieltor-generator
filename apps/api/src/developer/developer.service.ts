import { Injectable, NotFoundException } from '@nestjs/common';
import type { Organization } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * USER -> DEVELOPER + a new organization with the caller as OWNER.
   * Idempotent: an existing member keeps their org (no second org is created).
   */
  async becomeDeveloper(userId: string, name: string, district?: string): Promise<Organization> {
    const existing = await this.prisma.membership.findUnique({
      where: { userId },
      select: { orgId: true },
    });
    if (existing) return this.orgView(userId); // idempotent — do not create a second org
    // One transaction: a crash between the writes would otherwise strand a DEVELOPER
    // with no org — unrecoverable, since the become-developer page is gone once role=DEVELOPER.
    await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name, district: district ?? null } });
      await tx.membership.create({ data: { orgId: org.id, userId, role: 'OWNER' } });
      await tx.user.update({ where: { id: userId }, data: { role: 'DEVELOPER' } });
    });
    return this.orgView(userId);
  }

  /** The caller's org id, resolved from their single membership. Throws if none (guard prevents this). */
  async orgIdOf(userId: string): Promise<string> {
    const m = await this.prisma.membership.findUnique({
      where: { userId },
      select: { orgId: true },
    });
    if (!m) throw new NotFoundException('Tashkilot topilmadi');
    return m.orgId;
  }

  async orgView(userId: string): Promise<Organization> {
    const orgId = await this.orgIdOf(userId);
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        district: true,
        members: {
          select: { userId: true, role: true, user: { select: { name: true, phone: true } } },
        },
      },
    });
    return {
      id: org!.id,
      name: org!.name,
      district: org!.district,
      members: org!.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        name: m.user.name,
        phone: m.user.phone,
      })),
    };
  }
}
