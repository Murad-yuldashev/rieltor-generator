import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TOPUP_PACKAGES, type WalletView } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create the realtor's wallet on first touch (idempotent under the unique
   * userId). Public so Task 4 can call it before opening its claim transaction.
   */
  async ensureWallet(userId: string): Promise<void> {
    try {
      await this.prisma.wallet.upsert({
        where: { userId },
        create: { userId, balanceSom: 0n },
        update: {},
      });
    } catch (e) {
      // A concurrent create raced us; the row now exists — ignore the unique violation.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
  }

  /** Current balance plus the recent ledger, for the realtor cabinet. */
  async view(userId: string): Promise<WalletView> {
    await this.ensureWallet(userId);
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: {
        balanceSom: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            type: true,
            amountSom: true,
            leadId: true,
            fixationId: true,
            createdAt: true,
          },
        },
      },
    });
    return {
      balanceSom: String(wallet!.balanceSom),
      transactions: wallet!.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountSom: String(t.amountSom),
        leadId: t.leadId,
        fixationId: t.fixationId,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Test-payment stub: credit the chosen package. The `increment` is atomic, so
   * no row lock is needed — the credit and its ledger row land in one tx.
   */
  async topup(userId: string, packageId: 'p100' | 'p300' | 'p500'): Promise<WalletView> {
    await this.ensureWallet(userId);
    const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) throw new BadRequestException('Noto‘g‘ri paket');
    const amount = BigInt(pkg.amountSom);
    await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { userId },
        data: { balanceSom: { increment: amount } },
        select: { id: true },
      });
      await tx.walletTransaction.create({
        data: { walletId: w.id, type: 'TOPUP', amountSom: amount },
      });
    });
    return this.view(userId);
  }

  /**
   * Debit a lead's price inside the caller's claim transaction (Task 4). Runs on
   * the passed `tx`, never opening its own. The wallet must already exist (the
   * caller runs `ensureWallet` first). Locks the wallet row FOR UPDATE so
   * concurrent claims serialize and cannot over-spend; throws 402 when short.
   */
  async debitForClaim(
    tx: Prisma.TransactionClient,
    userId: string,
    amountSom: bigint,
    leadId: string,
  ): Promise<void> {
    // Lock the realtor's wallet row so concurrent claims serialize.
    await tx.$queryRaw`SELECT 1 FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE`;
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true, balanceSom: true },
    });
    if (!wallet || wallet.balanceSom < amountSom) {
      throw new HttpException("Balans yetarli emas — hisobingizni to'ldiring", 402);
    }
    await tx.wallet.update({
      where: { userId },
      data: { balanceSom: { decrement: amountSom } },
    });
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: 'LEAD_CLAIM', amountSom, leadId },
    });
  }

  /**
   * Credit the realtor's wallet inside the caller's transaction (Task 6). Runs on
   * the passed `tx`, never opening its own. Self-ensures the wallet via an in-tx
   * `upsert` (creating it with the credited balance on first touch), so the caller
   * needs no separate `ensureWallet` — no base-client call inside the open tx. The
   * `increment` is atomic, so no row lock is needed — the credit and its COMMISSION
   * ledger row land in the caller's tx.
   */
  async credit(
    tx: Prisma.TransactionClient,
    userId: string,
    amountSom: bigint,
    ref: { fixationId?: string } = {},
  ): Promise<void> {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId, balanceSom: amountSom },
      update: { balanceSom: { increment: amountSom } },
      select: { id: true },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'COMMISSION',
        amountSom,
        fixationId: ref.fixationId ?? null,
      },
    });
  }
}
