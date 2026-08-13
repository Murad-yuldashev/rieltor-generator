import { Injectable, Logger } from '@nestjs/common';
import { BotService } from '../bot/bot.service';
import { PrismaService } from '../prisma/prisma.service';
import { fetchCbuUsdRate } from './cbu-fx';

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far ahead of expiresAt the "expiring soon" reminder fires (design spec §7.5). */
const EXPIRY_WARNING_MS = 3 * DAY_MS;
/** Event rows older than this are pruned (design spec §7.5, §8.2). */
const EVENT_RETENTION_MS = 90 * DAY_MS;
/** A lead still NEW this long after arriving gets the realtor a reminder (stage 5, spec §8.4). */
const LEAD_REMINDER_MS = DAY_MS;

export interface CronSummary {
  archived: number;
  expiryNotified: number;
  fxRateUpdated: boolean;
  eventsDeleted: number;
  leadsReminded: number;
}

/**
 * The daily maintenance tasks from design spec §7.5, run by
 * POST /api/internal/cron/daily. Every Listing-mutating query here filters on
 * `realtorId: { not: null }` — the seed's 18 listings have no owner and must never
 * be touched by a cron job the realtor cabinet introduced.
 */
@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bot: BotService,
  ) {}

  async runDaily(now: Date = new Date()): Promise<CronSummary> {
    // Sequential, not Promise.all: archiving first means the "expiring soon" step
    // below only ever sees listings still ACTIVE/RESERVED, i.e. not yet expired.
    const archived = await this.archiveExpired(now);
    const expiryNotified = await this.flagExpiringSoon(now);
    const fxRateUpdated = await this.refreshFxRate(now);
    const eventsDeleted = await this.pruneOldEvents(now);
    const leadsReminded = await this.remindStaleLeads(now);

    return { archived, expiryNotified, fxRateUpdated, eventsDeleted, leadsReminded };
  }

  /** Task 1: expired ACTIVE/RESERVED listings owned by a real realtor → ARCHIVED. */
  private async archiveExpired(now: Date): Promise<number> {
    const result = await this.prisma.listing.updateMany({
      where: {
        status: { in: ['ACTIVE', 'RESERVED'] },
        realtorId: { not: null },
        expiresAt: { lt: now },
      },
      data: { status: 'ARCHIVED' },
    });
    return result.count;
  }

  /** Task 2: listings within 3 days of expiry get expiryNotifiedAt stamped once. */
  private async flagExpiringSoon(now: Date): Promise<number> {
    const threshold = new Date(now.getTime() + EXPIRY_WARNING_MS);
    const result = await this.prisma.listing.updateMany({
      where: {
        status: { in: ['ACTIVE', 'RESERVED'] },
        realtorId: { not: null },
        expiresAt: { lte: threshold },
        expiryNotifiedAt: null,
      },
      data: { expiryNotifiedAt: now },
    });
    return result.count;
  }

  /**
   * Task 3: fetch today's USD/UZS rate from CBU and upsert it. Any failure — network,
   * non-200, unexpected shape — is caught here and only logged: the row for `date`
   * simply does not get written, so latestUsdRate() (ListingsWriteService) and any
   * future read keep resolving to the most recent row that DID succeed.
   */
  private async refreshFxRate(now: Date): Promise<boolean> {
    try {
      const usdRate = await fetchCbuUsdRate();
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      await this.prisma.fxRate.upsert({
        where: { date },
        create: { date, usdRate },
        update: { usdRate, fetchedAt: now },
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `CBU kursini olib bo'lmadi, oxirgi saqlangan kurs ishlatilaveradi: ${String(error)}`,
      );
      return false;
    }
  }

  /** Task 4: Event rows older than 90 days are deleted. */
  private async pruneOldEvents(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - EVENT_RETENTION_MS);
    const result = await this.prisma.event.deleteMany({ where: { createdAt: { lt: cutoff } } });
    return result.count;
  }

  /**
   * Task 5 (stage 5, spec §8.4): a lead still NEW 24h after arriving gets its
   * realtor a Telegram reminder, then notifiedAt is stamped for the whole batch so
   * the next run never repeats it — same "stamp once" shape as flagExpiringSoon.
   */
  private async remindStaleLeads(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - LEAD_REMINDER_MS);
    const stale = await this.prisma.lead.findMany({
      where: { status: 'NEW', notifiedAt: null, createdAt: { lte: cutoff } },
      select: {
        id: true,
        name: true,
        phone: true,
        listing: { select: { title: true, realtorId: true } },
      },
    });
    if (stale.length === 0) return 0;

    for (const lead of stale) {
      await this.notifyStaleLead(lead);
    }

    const result = await this.prisma.lead.updateMany({
      where: { id: { in: stale.map((lead) => lead.id) } },
      data: { notifiedAt: now },
    });
    return result.count;
  }

  /** realtorId is null for a seed listing — nobody to notify, so this just no-ops. */
  private async notifyStaleLead(lead: {
    name: string;
    phone: string;
    listing: { title: string; realtorId: string | null };
  }): Promise<void> {
    if (!lead.listing.realtorId) return;
    const realtor = await this.prisma.realtor.findUnique({
      where: { id: lead.listing.realtorId },
      select: { tgId: true },
    });
    if (!realtor) return;
    await this.bot.sendMessage(
      realtor.tgId,
      `Eslatma: ${lead.name}, ${lead.phone} (${lead.listing.title}) hali bog'lanilmagan`,
    );
  }
}
