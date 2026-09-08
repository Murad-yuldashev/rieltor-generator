import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TOPUP_PACKAGES, type OrgWalletView } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The developer organization's prepaid wallet. Mirrors the realtor `WalletService`,
 * but the org balance MAY be negative — a fixation commission is debited
 * unconditionally, so an org that has not topped up simply goes into debt.
 */
@Injectable()
export class OrgWalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create the org's wallet on first touch (idempotent under the unique orgId).
   * Balance defaults to 0.
   */
  async ensureOrgWallet(orgId: string): Promise<void> {
    try {
      await this.prisma.orgWallet.upsert({
        where: { orgId },
        create: { orgId },
        update: {},
      });
    } catch (e) {
      // A concurrent create raced us; the row now exists — ignore the unique violation.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
  }

  /** Current balance plus the recent ledger, for the developer CRM cabinet. */
  async view(orgId: string): Promise<OrgWalletView> {
    await this.ensureOrgWallet(orgId);
    const wallet = await this.prisma.orgWallet.findUnique({
      where: { orgId },
      select: {
        balanceSom: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            type: true,
            amountSom: true,
            fixationId: true,
            createdAt: true,
          },
        },
      },
    });
    return {
      // MAY be negative (a debt) — do NOT clamp.
      balanceSom: String(wallet!.balanceSom),
      transactions: wallet!.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountSom: String(t.amountSom),
        fixationId: t.fixationId,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Test-payment stub: credit the chosen package. The `increment` is atomic, so
   * no row lock is needed — the credit and its ledger row land in one tx. The
   * `upsert` self-ensures the wallet (born with the credited balance on first touch).
   */
  async topup(orgId: string, packageId: 'p100' | 'p300' | 'p500'): Promise<OrgWalletView> {
    const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) throw new BadRequestException('Noto‘g‘ri paket');
    const amount = BigInt(pkg.amountSom);
    await this.prisma.$transaction(async (tx) => {
      const w = await tx.orgWallet.upsert({
        where: { orgId },
        create: { orgId, balanceSom: amount },
        update: { balanceSom: { increment: amount } },
        select: { id: true },
      });
      await tx.orgWalletTransaction.create({
        data: { orgWalletId: w.id, type: 'TOPUP', amountSom: amount },
      });
    });
    return this.view(orgId);
  }

  /**
   * Debit a fixation's commission inside the caller's transaction (Task 4). Runs on
   * the passed `tx`, never opening its own. Self-ensures the wallet via an in-tx
   * `upsert`, so the caller needs no separate `ensureOrgWallet`.
   *
   * UNCONDITIONAL — unlike the realtor `debitForClaim`, there is NO `FOR UPDATE`
   * lock, NO balance guard, and it NEVER throws 402: a new org's wallet is born
   * already in debt at `-amountSom`, an existing wallet is decremented, and the
   * balance MAY go negative. `amountSom` is stored POSITIVE; the COMMISSION_DEBIT
   * type carries the direction.
   */
  async debitForCommission(
    tx: Prisma.TransactionClient,
    orgId: string,
    amountSom: bigint,
    ref: { fixationId?: string },
  ): Promise<void> {
    const w = await tx.orgWallet.upsert({
      where: { orgId },
      create: { orgId, balanceSom: -amountSom },
      update: { balanceSom: { decrement: amountSom } },
      select: { id: true },
    });
    await tx.orgWalletTransaction.create({
      data: {
        orgWalletId: w.id,
        type: 'COMMISSION_DEBIT',
        amountSom,
        fixationId: ref.fixationId ?? null,
      },
    });
  }

  /**
   * Refund a clawed-back commission to the org inside the caller's transaction (6.3).
   * The reverse of `debitForCommission`: unconditional `increment`, no lock; the org
   * wallet is credited back the exact snapshot amount. `amountSom` stored POSITIVE;
   * the COMMISSION_REFUND type carries the credit direction.
   */
  async creditRefund(
    tx: Prisma.TransactionClient,
    orgId: string,
    amountSom: bigint,
    ref: { fixationId?: string },
  ): Promise<void> {
    const w = await tx.orgWallet.upsert({
      where: { orgId },
      create: { orgId, balanceSom: amountSom },
      update: { balanceSom: { increment: amountSom } },
      select: { id: true },
    });
    await tx.orgWalletTransaction.create({
      data: {
        orgWalletId: w.id,
        type: 'COMMISSION_REFUND',
        amountSom,
        fixationId: ref.fixationId ?? null,
      },
    });
  }
}
