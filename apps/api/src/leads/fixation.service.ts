import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Fixation, canonicalizePhone } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

export type FixationRow = {
  id: string;
  unitId: string;
  propertyRequestId: string;
  buyerPhone: string;
  status: Fixation['status'];
  commissionBps: number;
  commissionSom: bigint | null;
  createdAt: Date;
  convertedAt: Date | null;
};

@Injectable()
export class FixationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The claiming realtor fixates a NEW_BUILD lead onto a developer unit, taking an
   * exclusive hold for that buyer. The unit row is locked FOR UPDATE so two realtors
   * fixating the same (unit, buyer) serialize — the second sees the ACTIVE fixation
   * and 409s. The effective commission rate is snapshotted at fixate time; the paid
   * `commissionSom` stays null until conversion (Task 6).
   */
  async fixate(userId: string, leadId: string, unitId?: string): Promise<Fixation> {
    const lead = await this.prisma.propertyRequest.findUnique({
      where: { id: leadId },
      select: {
        claimedById: true,
        status: true,
        type: true,
        complexId: true,
        unitId: true,
        author: { select: { phone: true } },
      },
    });
    // A foreign (or missing) lead is indistinguishable from not-found to the caller.
    if (!lead || lead.claimedById !== userId) throw new NotFoundException('Lead topilmadi');
    if (lead.status !== 'CLAIMED') throw new ConflictException('Bu lead hali olinmagan');
    if (lead.type !== 'NEW_BUILD' || !lead.complexId) {
      throw new BadRequestException("Bu lead uchun fiksatsiya qilib bo'lmaydi");
    }

    const complexId = lead.complexId;
    // Resolve the target unit: the lead's own unit, or the caller's explicit choice.
    const targetUnitId = unitId ?? lead.unitId;
    if (!targetUnitId) throw new BadRequestException('Xonadonni tanlang');
    // Validate the unit belongs to the lead's complex (unit → building → complex).
    const unit = await this.prisma.unit.findUnique({
      where: { id: targetUnitId },
      select: { id: true, commissionBps: true, building: { select: { complexId: true } } },
    });
    if (!unit) throw new NotFoundException('Xonadon topilmadi');
    if (unit.building.complexId !== complexId) {
      throw new BadRequestException('Bu xonadon lead majmuasiga tegishli emas');
    }

    const buyerPhone = canonicalizePhone(lead.author.phone);

    return this.prisma.$transaction(async (tx) => {
      // Lock the unit so concurrent fixations on the same (unit, buyer) serialize.
      await tx.$queryRaw`SELECT 1 FROM "Unit" WHERE id = ${targetUnitId} FOR UPDATE`;

      // The @unique propertyRequestId means at most one fixation row per lead. An
      // ACTIVE one blocks a re-fixate (409); a CONVERTED one is an immutable sale
      // (409); a CANCELLED one is revived in place below rather than re-created.
      const existingForLead = await tx.fixation.findUnique({
        where: { propertyRequestId: leadId },
        select: { status: true },
      });
      if (existingForLead && existingForLead.status !== 'CANCELLED') {
        throw new ConflictException('Bu lead allaqachon fiksatsiya qilingan');
      }

      // A competing ACTIVE fixation for the same unit + buyer on a DIFFERENT lead
      // means another realtor already holds this client for this unit.
      const competing = await tx.fixation.findFirst({
        where: {
          unitId: targetUnitId,
          buyerPhone,
          status: 'ACTIVE',
          propertyRequestId: { not: leadId },
        },
        select: { id: true },
      });
      if (competing) {
        throw new ConflictException('Bu xonadon uchun mijoz allaqachon fiksatsiya qilingan');
      }

      // Snapshot the effective rate: unit override → complex default → 0.
      const complex = await tx.complex.findUnique({
        where: { id: complexId },
        select: { commissionBps: true },
      });
      const commissionBps = unit.commissionBps ?? complex?.commissionBps ?? 0;

      // Revive a previously CANCELLED row (unique propertyRequestId forbids a 2nd
      // create) or create the first fixation for this lead. Either way it starts
      // ACTIVE with a fresh rate snapshot and commissionSom null (set at convert).
      const created = existingForLead
        ? await tx.fixation.update({
            where: { propertyRequestId: leadId },
            data: {
              realtorId: userId,
              unitId: targetUnitId,
              buyerPhone,
              status: 'ACTIVE',
              commissionBps,
              commissionSom: null,
              createdAt: new Date(),
              cancelledAt: null,
              convertedAt: null,
            },
          })
        : await tx.fixation.create({
            data: {
              realtorId: userId,
              unitId: targetUnitId,
              propertyRequestId: leadId,
              buyerPhone,
              status: 'ACTIVE',
              commissionBps,
              commissionSom: null, // set only at conversion (Task 6)
            },
          });
      return toFixation(created);
    });
  }

  /**
   * The realtor cancels their own ACTIVE fixation on a lead. Only the holding
   * realtor may cancel; a missing/foreign fixation reads as not-found.
   */
  async cancelFixation(userId: string, leadId: string): Promise<Fixation> {
    const fixation = await this.prisma.fixation.findFirst({
      where: { propertyRequestId: leadId, realtorId: userId, status: 'ACTIVE' },
    });
    if (!fixation) throw new NotFoundException('Fiksatsiya topilmadi');
    const updated = await this.prisma.fixation.update({
      where: { id: fixation.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    return toFixation(updated);
  }
}

export function toFixation(row: FixationRow): Fixation {
  return {
    id: row.id,
    unitId: row.unitId,
    propertyRequestId: row.propertyRequestId,
    buyerPhone: row.buyerPhone,
    status: row.status,
    commissionBps: row.commissionBps,
    commissionSom: row.commissionSom != null ? String(row.commissionSom) : null,
    createdAt: row.createdAt.toISOString(),
    convertedAt: row.convertedAt ? row.convertedAt.toISOString() : null,
  };
}
