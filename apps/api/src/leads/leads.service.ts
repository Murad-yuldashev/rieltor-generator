import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type Lead,
  type LeadClaimResponse,
  type LeadFunnel,
  type LeadLostReason,
  type LeadLostReasonCounts,
  type LeadOutcomeStage,
  type LeadStats,
  maskPhone,
} from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { winRate } from './lead-scoring';

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
  outcomeStage: Lead['outcomeStage'];
  lostReason: Lead['lostReason'];
  outcomeUpdatedAt: Date | null;
  author: { phone: string };
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

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
   * reads that status and 409s. The claim now debits the lead's priceSom from
   * the realtor's wallet inside this same transaction (402 if the balance is short).
   */
  async claim(id: string, realtorId: string): Promise<LeadClaimResponse> {
    // Ensure the wallet row exists (idempotent, race-safe) so the debit can lock it.
    await this.wallet.ensureWallet(realtorId);
    return this.prisma.$transaction(async (tx) => {
      // Lock the lead row so two concurrent claims serialize; the loser sees CLAIMED.
      await tx.$queryRaw`SELECT 1 FROM "PropertyRequest" WHERE id = ${id} FOR UPDATE`;
      const lead = await tx.propertyRequest.findUnique({
        where: { id },
        select: {
          status: true,
          authorId: true,
          priceSom: true,
          author: { select: { phone: true, name: true } },
        },
      });
      if (!lead) throw new NotFoundException();
      if (lead.authorId === realtorId) throw new BadRequestException("O'z lead'ingizni ololmaysiz");
      if (lead.status !== 'OPEN') throw new ConflictException('Bu lead allaqachon olingan');
      // Debit the lead's price (locks the wallet row; 402 if short) before claiming.
      await this.wallet.debitForClaim(tx, realtorId, lead.priceSom, id);
      await tx.propertyRequest.update({
        where: { id },
        data: {
          status: 'CLAIMED',
          claimedById: realtorId,
          claimedAt: new Date(),
          outcomeStage: 'NEW',
        },
      });
      await tx.contactReveal.create({ data: { requestId: id, userId: realtorId, ip: '' } });
      return { phone: lead.author.phone, name: lead.author.name };
    });
  }

  /**
   * The claiming realtor records the outcome of a claimed lead. Ownership +
   * CLAIMED are the only invariants — the realtor may move the stage freely
   * (including backward) to correct a mistake. LOST requires a reason.
   */
  async setOutcome(
    id: string,
    realtorId: string,
    stage: LeadOutcomeStage,
    lostReason?: LeadLostReason,
  ): Promise<Lead> {
    const lead = await this.prisma.propertyRequest.findUnique({
      where: { id },
      select: { claimedById: true, outcomeStage: true },
    });
    if (!lead) throw new NotFoundException();
    if (lead.claimedById !== realtorId) throw new ForbiddenException('Bu lead sizniki emas');
    if (lead.outcomeStage == null) throw new ConflictException('Bu lead hali olinmagan');
    if (stage === 'LOST' && !lostReason) {
      throw new BadRequestException("Yo'qotish sababini tanlang");
    }
    await this.prisma.propertyRequest.update({
      where: { id },
      data: {
        outcomeStage: stage,
        lostReason: stage === 'LOST' ? lostReason : null,
        outcomeUpdatedAt: new Date(),
      },
    });
    return this.findOne(id, realtorId); // claimer -> contact revealed, outcome fields included
  }

  /** The caller's own claimed-lead funnel + win rate + loss-reason breakdown. */
  async stats(realtorId: string): Promise<LeadStats> {
    const byStage = await this.prisma.propertyRequest.groupBy({
      by: ['outcomeStage'],
      where: { claimedById: realtorId, outcomeStage: { not: null } },
      _count: { _all: true },
    });
    const funnel = emptyFunnel();
    for (const row of byStage) {
      if (row.outcomeStage) funnel[row.outcomeStage] = row._count._all;
    }
    const byReason = await this.prisma.propertyRequest.groupBy({
      by: ['lostReason'],
      where: { claimedById: realtorId, outcomeStage: 'LOST', lostReason: { not: null } },
      _count: { _all: true },
    });
    const lostReasons = emptyLostReasons();
    for (const row of byReason) {
      if (row.lostReason) lostReasons[row.lostReason] = row._count._all;
    }
    return { funnel, winRate: winRate(funnel.WON, funnel.LOST), lostReasons };
  }
}

function emptyFunnel(): LeadFunnel {
  return { NEW: 0, CONTACTED: 0, MEETING: 0, WON: 0, LOST: 0 };
}

function emptyLostReasons(): LeadLostReasonCounts {
  return { NO_RESPONSE: 0, WRONG_NUMBER: 0, NOT_SERIOUS: 0, BOUGHT_ELSEWHERE: 0, OTHER: 0 };
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
    outcomeStage: row.outcomeStage,
    lostReason: row.lostReason,
    outcomeUpdatedAt: row.outcomeUpdatedAt ? row.outcomeUpdatedAt.toISOString() : null,
  };
}
