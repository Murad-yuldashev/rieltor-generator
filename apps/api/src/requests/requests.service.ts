import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  maskPhone,
  type PropertyRequestCreate,
  type PropertyRequestFilter,
  type PropertyRequestSummary,
} from '@rieltor/shared';
import {
  budgetTier,
  budgetTierPriceWhere,
  computeLeadScore,
  conversionAdjustment,
  priceForScore,
} from '../leads/lead-scoring';
import { PrismaService } from '../prisma/prisma.service';

type RequestRow = {
  id: string;
  deal: PropertyRequestSummary['deal'];
  type: PropertyRequestSummary['type'];
  district: string | null;
  roomsMin: number | null;
  priceMaxSom: bigint | null;
  areaMinM2: number | null;
  note: string | null;
  status: 'OPEN' | 'CLOSED' | 'CLAIMED' | 'EXPIRED';
  createdAt: Date;
  author: { phone: string };
};

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, body: PropertyRequestCreate) {
    const createdAt = new Date();
    const priceMaxSom = body.priceMaxSom != null ? BigInt(body.priceMaxSom) : null;
    const base = computeLeadScore({
      district: body.district ?? null,
      type: body.type ?? null,
      roomsMin: body.roomsMin ?? null,
      areaMinM2: body.areaMinM2 ?? null,
      note: body.note ?? null,
      priceMaxSom,
      createdAt,
    });

    // Conversion feedback: nudge the base by this segment's historical win rate,
    // shrunk toward the global rate so thin/no data leaves the base untouched.
    const tier = budgetTier(priceMaxSom);
    const segmentWhere = {
      deal: body.deal,
      type: body.type ?? null,
      priceMaxSom: budgetTierPriceWhere(tier),
    };
    const [segWon, segLost, gWon, gLost] = await Promise.all([
      this.prisma.propertyRequest.count({ where: { ...segmentWhere, outcomeStage: 'WON' } }),
      this.prisma.propertyRequest.count({ where: { ...segmentWhere, outcomeStage: 'LOST' } }),
      this.prisma.propertyRequest.count({ where: { outcomeStage: 'WON' } }),
      this.prisma.propertyRequest.count({ where: { outcomeStage: 'LOST' } }),
    ]);
    const globalResolved = gWon + gLost;
    const adjustment =
      globalResolved === 0 ? 0 : conversionAdjustment(segWon, segLost, gWon / globalResolved);
    const score = Math.max(0, Math.min(100, base + adjustment));
    const priceSom = priceForScore(score);
    const row = await this.prisma.propertyRequest.create({
      data: {
        authorId: userId,
        deal: body.deal,
        type: body.type ?? null,
        district: body.district ?? null,
        roomsMin: body.roomsMin ?? null,
        priceMaxSom,
        areaMinM2: body.areaMinM2 ?? null,
        note: body.note ?? null,
        score,
        priceSom,
        // Marketplace inquiry provenance (5.3): persisted only when present, so the
        // plain seeker flow is unchanged.
        ...(body.complexId && { complexId: body.complexId }),
        ...(body.unitId && { unitId: body.unitId }),
      },
      include: { author: { select: { phone: true } } },
    });
    return toSummary(row as RequestRow);
  }

  async listOpen(filter: PropertyRequestFilter): Promise<PropertyRequestSummary[]> {
    const rows = await this.prisma.propertyRequest.findMany({
      where: {
        status: 'OPEN',
        deal: filter.deal,
        type: filter.type,
        district: filter.district,
        roomsMin: filter.roomsMin != null ? { gte: filter.roomsMin } : undefined,
        priceMaxSom: filter.priceMaxSom != null ? { lte: BigInt(filter.priceMaxSom) } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { phone: true } } },
      take: 100,
    });
    return rows.map((r) => toSummary(r as RequestRow));
  }

  async findOne(id: string): Promise<PropertyRequestSummary> {
    const row = await this.prisma.propertyRequest.findUnique({
      where: { id },
      include: { author: { select: { phone: true } } },
    });
    if (!row) throw new NotFoundException();
    return toSummary(row as RequestRow);
  }

  async close(id: string, userId: string): Promise<void> {
    await this.assertAuthor(id, userId);
    await this.prisma.propertyRequest.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  async remove(id: string, userId: string): Promise<void> {
    const { count } = await this.prisma.propertyRequest.deleteMany({
      where: { id, authorId: userId },
    });
    if (count === 0) throw new NotFoundException();
  }

  async listMine(userId: string): Promise<PropertyRequestSummary[]> {
    const rows = await this.prisma.propertyRequest.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { phone: true } } },
    });
    return rows.map((r) => toSummary(r as RequestRow));
  }

  private async assertAuthor(id: string, userId: string) {
    const row = await this.prisma.propertyRequest.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!row) throw new NotFoundException();
    if (row.authorId !== userId) throw new ForbiddenException();
  }
}

function toSummary(r: RequestRow): PropertyRequestSummary {
  return {
    id: r.id,
    deal: r.deal,
    type: r.type,
    district: r.district,
    roomsMin: r.roomsMin,
    priceMaxSom: r.priceMaxSom != null ? String(r.priceMaxSom) : null,
    areaMinM2: r.areaMinM2,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    authorPhoneMasked: maskPhone(r.author.phone),
  };
}
