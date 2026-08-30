import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Lead, type LeadClaimResponse, maskPhone } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

type LeadRow = {
  id: string;
  deal: Lead['deal'];
  type: Lead['type'];
  district: string | null;
  roomsMin: number | null;
  priceMaxSom: bigint | null;
  areaMinM2: number | null;
  note: string | null;
  status: Lead['status'];
  score: number;
  priceSom: bigint;
  createdAt: Date;
  claimedById: string | null;
  author: { phone: string };
};

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Open leads for the realtor feed, best-scored first; contact stays masked. */
  async feed(): Promise<Lead[]> {
    // `score: { gt: 0 }` hides pre-branch legacy rows the migration defaulted to
    // score=0 (they would show "Sifat: 0 / 0 so'm"). A freshly-created lead always
    // scores ≥20 (recency alone is 20 at create), so this never drops a real lead.
    const rows = await this.prisma.propertyRequest.findMany({
      where: { status: 'OPEN', score: { gt: 0 } },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { phone: true } } },
      take: 100,
    });
    return rows.map((r) => toLead(r as LeadRow, false));
  }

  /** A single lead; contact revealed only when the caller is the claimer. */
  async findOne(id: string, realtorId: string): Promise<Lead> {
    const row = await this.prisma.propertyRequest.findUnique({
      where: { id },
      include: { author: { select: { phone: true } } },
    });
    if (!row) throw new NotFoundException();
    const revealed = (row as LeadRow).claimedById === realtorId;
    return toLead(row as LeadRow, revealed);
  }

  /** Leads this realtor has claimed; contact always revealed. */
  async mine(realtorId: string): Promise<Lead[]> {
    const rows = await this.prisma.propertyRequest.findMany({
      where: { claimedById: realtorId },
      orderBy: { claimedAt: 'desc' },
      include: { author: { select: { phone: true } } },
    });
    return rows.map((r) => toLead(r as LeadRow, true));
  }

  /**
   * Exclusively claim an OPEN lead: reveal the buyer's contact and close the
   * lead to everyone else. The row is locked FIRST so two concurrent claims
   * serialize on it — the winner flips the status to CLAIMED, the loser then
   * reads that status and 409s. Claim is free here; payment lands in 4.2.
   */
  async claim(id: string, realtorId: string): Promise<LeadClaimResponse> {
    return this.prisma.$transaction(async (tx) => {
      // Lock the lead row so two concurrent claims serialize; the loser sees CLAIMED.
      await tx.$queryRaw`SELECT 1 FROM "PropertyRequest" WHERE id = ${id} FOR UPDATE`;
      const lead = await tx.propertyRequest.findUnique({
        where: { id },
        select: { status: true, authorId: true, author: { select: { phone: true, name: true } } },
      });
      if (!lead) throw new NotFoundException();
      if (lead.authorId === realtorId) throw new BadRequestException("O'z lead'ingizni ololmaysiz");
      if (lead.status !== 'OPEN') throw new ConflictException('Bu lead allaqachon olingan');
      await tx.propertyRequest.update({
        where: { id },
        data: { status: 'CLAIMED', claimedById: realtorId, claimedAt: new Date() },
      });
      await tx.contactReveal.create({ data: { requestId: id, userId: realtorId, ip: '' } });
      return { phone: lead.author.phone, name: lead.author.name };
    });
  }
}

function toLead(row: LeadRow, revealed: boolean): Lead {
  return {
    id: row.id,
    deal: row.deal,
    type: row.type,
    district: row.district,
    roomsMin: row.roomsMin,
    priceMaxSom: row.priceMaxSom != null ? String(row.priceMaxSom) : null,
    areaMinM2: row.areaMinM2,
    note: row.note,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    authorPhoneMasked: maskPhone(row.author.phone),
    score: row.score,
    priceSom: String(row.priceSom),
    phone: revealed ? row.author.phone : null,
  };
}
