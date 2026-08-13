import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Lead as LeadRow } from '@prisma/client';
import { nextLeadStatuses, type Lead, type LeadCreate, type LeadStatus } from '@rieltor/shared';
import { hashIp } from '../analytics/ip-hash';
import { BotService } from '../bot/bot.service';
import type { Env } from '../config/env';
import { PUBLIC_DETAIL_STATUSES } from '../listings/listings.service';
import { PrismaService } from '../prisma/prisma.service';

/** One ipHash+listingId lead is accepted at most once per hour (design spec §8.4). */
const LEAD_DEDUP_WINDOW_MS = 60 * 60 * 1000;

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    listingId: row.listingId,
    name: row.name,
    phone: row.phone,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly bot: BotService,
  ) {}

  /**
   * POST /api/leads (public, no guard — the "leave your number" CTA on a listing
   * page, called from every visitor's browser like POST /api/event). Rejects a
   * filled honeypot, a listing that is not publicly visible, and a repeat
   * submission from the same ipHash+listing within an hour, then notifies the
   * listing's realtor over Telegram (design spec §8.4).
   */
  async create(input: LeadCreate, honeypot: string | undefined, ip: string): Promise<{ id: string }> {
    // Cheapest check first — a filled honeypot never needs a database round trip.
    if (honeypot) {
      throw new BadRequestException("Noto'g'ri so'rov");
    }

    // Same "is this listing publicly visible" rule as GET /api/objects/:id — a
    // DRAFT/PENDING/ARCHIVED listing, or an unknown id, must not be leadable.
    const listing = await this.prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { status: true, title: true, realtorId: true },
    });
    if (!listing || !PUBLIC_DETAIL_STATUSES.includes(listing.status)) {
      throw new NotFoundException(`Obyekt topilmadi: ${input.listingId}`);
    }

    const secret = this.config.get('IP_HASH_SECRET', { infer: true });
    const ipHash = hashIp(ip, secret);
    const since = new Date(Date.now() - LEAD_DEDUP_WINDOW_MS);
    const recent = await this.prisma.lead.findFirst({
      where: { ipHash, listingId: input.listingId, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) {
      throw new ConflictException("Bu obyekt uchun so'rovingiz allaqachon qabul qilingan");
    }

    const lead = await this.prisma.lead.create({
      data: { listingId: input.listingId, name: input.name, phone: input.phone, ipHash },
      select: { id: true },
    });

    await this.notifyNewLead(listing.realtorId, input.name, input.phone, listing.title);

    return lead;
  }

  /** Every lead across every listing the realtor owns, newest first. */
  async findAllForRealtor(realtorId: string): Promise<Lead[]> {
    const rows = await this.prisma.lead.findMany({
      where: { listing: { realtorId } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toLead);
  }

  /**
   * PATCH /api/me/leads/:id — 404 if the lead does not exist, 403 if it belongs to
   * another realtor's listing, 409 if `status` is not one of nextLeadStatuses().
   */
  async updateStatus(realtorId: string, id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: { status: true, listing: { select: { realtorId: true } } },
    });
    if (!lead) throw new NotFoundException(`Lid topilmadi: ${id}`);
    if (lead.listing.realtorId !== realtorId) {
      throw new ForbiddenException('Bu lid sizga tegishli emas');
    }
    if (!nextLeadStatuses(lead.status).includes(status)) {
      throw new ConflictException(`Holatni ${lead.status} dan ${status} ga o'zgartirib bo'lmaydi`);
    }

    const updated = await this.prisma.lead.update({ where: { id }, data: { status } });
    return toLead(updated);
  }

  /**
   * realtorId comes straight off the Listing row (not via RealtorsService, whose
   * RealtorProfile deliberately omits tgId — see its comment). A seed listing has
   * realtorId = null, so there is simply nobody to notify.
   */
  private async notifyNewLead(
    realtorId: string | null,
    name: string,
    phone: string,
    listingTitle: string,
  ): Promise<void> {
    if (!realtorId) return;
    const realtor = await this.prisma.realtor.findUnique({
      where: { id: realtorId },
      select: { tgId: true },
    });
    if (!realtor) return;
    await this.bot.sendMessage(realtor.tgId, `Yangi lid: ${name}, ${phone}, ${listingTitle}`);
  }
}
