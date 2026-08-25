import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  TrackedProperty,
  TrackedPropertyCreate,
  TrackedPropertyDetail,
} from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ValuationService } from '../valuation/valuation.service';
import { modeledHistory } from './price-history';

type SnapshotRow = { estimateSom: bigint; capturedAt: Date; source: 'MODELED' | 'ACTUAL' };
type PropertyRow = {
  id: string;
  label: string | null;
  type: TrackedProperty['type'];
  district: string;
  rooms: number | null;
  areaM2: number;
  floor: string | null;
  createdAt: Date;
  snapshots: SnapshotRow[];
};

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly valuation: ValuationService,
  ) {}

  async create(userId: string, body: TrackedPropertyCreate): Promise<TrackedPropertyDetail> {
    const today = new Date();
    const { estimateSom } = await this.valuation.estimate({
      type: body.type,
      district: body.district,
      rooms: body.rooms,
      areaM2: body.areaM2,
    });
    const property = await this.prisma.trackedProperty.create({
      data: {
        ownerId: userId,
        label: body.label ?? null,
        type: body.type,
        district: body.district,
        rooms: body.rooms,
        areaM2: body.areaM2,
        floor: body.floor ?? null,
      },
    });
    const estimate = BigInt(estimateSom);
    const modeled = modeledHistory(property.id, estimate, today);
    await this.prisma.priceSnapshot.createMany({
      data: [
        ...modeled.map((p) => ({
          trackedPropertyId: property.id,
          estimateSom: p.estimateSom,
          capturedAt: p.capturedAt,
          source: 'MODELED' as const,
        })),
        {
          trackedPropertyId: property.id,
          estimateSom: estimate,
          capturedAt: today,
          source: 'ACTUAL' as const,
        },
      ],
    });
    return this.findOne(property.id, userId);
  }

  async listMine(userId: string): Promise<TrackedProperty[]> {
    const rows = await this.prisma.trackedProperty.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { snapshots: { orderBy: { capturedAt: 'asc' } } },
    });
    return rows.map((r) => toSummary(r as PropertyRow));
  }

  async findOne(id: string, userId: string): Promise<TrackedPropertyDetail> {
    const row = await this.prisma.trackedProperty.findFirst({
      where: { id, ownerId: userId },
      include: { snapshots: { orderBy: { capturedAt: 'asc' } } },
    });
    if (!row) throw new NotFoundException();
    const p = row as PropertyRow;
    return {
      ...toSummary(p),
      snapshots: p.snapshots.map((s) => ({
        estimateSom: String(s.estimateSom),
        capturedAt: s.capturedAt.toISOString(),
        source: s.source,
      })),
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const { count } = await this.prisma.trackedProperty.deleteMany({
      where: { id, ownerId: userId },
    });
    if (count === 0) throw new NotFoundException();
  }
}

function toSummary(p: PropertyRow): TrackedProperty {
  const snaps = p.snapshots;
  const latest = snaps[snaps.length - 1];
  const prior = snaps[snaps.length - 2];
  const latestNum = latest ? Number(latest.estimateSom) : 0;
  const priorNum = prior ? Number(prior.estimateSom) : 0;
  const deltaPct = prior && priorNum > 0 ? ((latestNum - priorNum) / priorNum) * 100 : 0;
  return {
    id: p.id,
    label: p.label,
    type: p.type,
    district: p.district,
    rooms: p.rooms,
    areaM2: p.areaM2,
    floor: p.floor,
    createdAt: p.createdAt.toISOString(),
    estimateSom: latest ? String(latest.estimateSom) : '0',
    deltaPct: Math.round(deltaPct * 10) / 10,
    sparkline: snaps.map((s) => String(s.estimateSom)),
  };
}
