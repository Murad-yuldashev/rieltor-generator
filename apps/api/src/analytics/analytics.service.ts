import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type {
  EventCreate,
  EventType,
  ListingStats,
  ShareBreakdownItem,
  StatsWindow,
} from '@rieltor/shared';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { hashIp } from './ip-hash';

/** One ipHash+listingId+type combination is recorded at most once per window (spec §8.2). */
const DEDUP_WINDOW_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type CountByType = { type: EventType; _count: number };
type CountByShareAndType = { shareCode: string | null; type: EventType; _count: number };

/** Folds groupBy rows shaped {type, _count} into the {views, callClicks, tgClicks} triple. */
function toWindow(rows: CountByType[]): StatsWindow {
  const window: StatsWindow = { views: 0, callClicks: 0, tgClicks: 0 };
  for (const row of rows) {
    if (row.type === 'VIEW') window.views += row._count;
    else if (row.type === 'CALL_CLICK') window.callClicks += row._count;
    else if (row.type === 'TG_CLICK') window.tgClicks += row._count;
  }
  return window;
}

/** Pivots {shareCode, type, _count} rows into one StatsWindow per shareCode. */
function toBreakdown(
  rows: CountByShareAndType[],
  labelByCode: Map<string, string | null>,
): ShareBreakdownItem[] {
  const byCode = new Map<string | null, StatsWindow>();
  for (const row of rows) {
    const bucket = byCode.get(row.shareCode) ?? { views: 0, callClicks: 0, tgClicks: 0 };
    if (row.type === 'VIEW') bucket.views += row._count;
    else if (row.type === 'CALL_CLICK') bucket.callClicks += row._count;
    else if (row.type === 'TG_CLICK') bucket.tgClicks += row._count;
    byCode.set(row.shareCode, bucket);
  }
  return [...byCode.entries()].map(([shareCode, counts]) => ({
    shareCode,
    label: shareCode ? (labelByCode.get(shareCode) ?? null) : null,
    ...counts,
  }));
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Records a VIEW/CALL_CLICK/TG_CLICK, deduplicated in the database rather than an
   * in-memory Map — a serverless instance's memory does not survive a cold start,
   * so only the database is around long enough to make the 10-minute window mean
   * anything (spec §2.3, §8.2). This runs alongside, and never touches, the
   * existing Listing.views counter from POST /api/view/:id.
   */
  async recordEvent(input: EventCreate, ip: string): Promise<{ recorded: boolean }> {
    const secret = this.config.get('IP_HASH_SECRET', { infer: true });
    const ipHash = hashIp(ip, secret);
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);

    const recent = await this.prisma.event.findFirst({
      where: { ipHash, listingId: input.listingId, type: input.type, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) return { recorded: false };

    try {
      await this.prisma.event.create({
        data: { listingId: input.listingId, type: input.type, shareCode: input.shareCode, ipHash },
      });
      return { recorded: true };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException(`Obyekt topilmadi: ${input.listingId}`);
      }
      throw error;
    }
  }

  /** Stats across every listing the realtor owns. */
  async statsForRealtor(realtorId: string, now: Date = new Date()): Promise<ListingStats> {
    return this.computeStats({ listing: { realtorId } }, now);
  }

  /** Stats for one listing — 404/403 if it is not this realtor's. */
  async statsForListing(
    realtorId: string,
    listingId: string,
    now: Date = new Date(),
  ): Promise<ListingStats> {
    await this.assertOwner(realtorId, listingId);
    return this.computeStats({ listingId }, now);
  }

  private async computeStats(base: Prisma.EventWhereInput, now: Date): Promise<ListingStats> {
    const since7 = new Date(now.getTime() - 7 * DAY_MS);
    const since30 = new Date(now.getTime() - 30 * DAY_MS);

    const [rows7, rows30, breakdownRows] = await Promise.all([
      this.prisma.event.groupBy({
        by: ['type'],
        where: { ...base, createdAt: { gte: since7 } },
        _count: true,
      }),
      this.prisma.event.groupBy({
        by: ['type'],
        where: { ...base, createdAt: { gte: since30 } },
        _count: true,
      }),
      this.prisma.event.groupBy({
        by: ['shareCode', 'type'],
        where: { ...base, createdAt: { gte: since30 } },
        _count: true,
      }),
    ]);

    const codes = [...new Set(breakdownRows.map((row) => row.shareCode).filter((c): c is string => c !== null))];
    const links = codes.length
      ? await this.prisma.shareLink.findMany({
          where: { code: { in: codes } },
          select: { code: true, label: true },
        })
      : [];
    const labelByCode = new Map(links.map((link) => [link.code, link.label]));

    return {
      last7d: toWindow(rows7),
      last30d: toWindow(rows30),
      byShare: toBreakdown(breakdownRows, labelByCode),
    };
  }

  /** 404 if the listing is missing, 403 if it belongs to another realtor. */
  private async assertOwner(realtorId: string, listingId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { realtorId: true },
    });
    if (!listing) throw new NotFoundException(`Obyekt topilmadi: ${listingId}`);
    if (listing.realtorId !== realtorId) {
      throw new ForbiddenException('Bu obyekt sizga tegishli emas');
    }
  }
}
