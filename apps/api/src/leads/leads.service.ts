import { Injectable, NotFoundException } from '@nestjs/common';
import { type Lead, maskPhone } from '@rieltor/shared';
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
    const rows = await this.prisma.propertyRequest.findMany({
      where: { status: 'OPEN' },
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
