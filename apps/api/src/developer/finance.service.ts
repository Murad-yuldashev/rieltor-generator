import { Injectable } from '@nestjs/common';
import type { DebtorRow, FinanceSummary } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Org finance snapshot. `now` is captured once so every metric agrees. */
  async summary(orgId: string): Promise<FinanceSummary> {
    const now = new Date();
    // Collection/debtor metrics count only LIVE (ACTIVE) contracts. A 6.3-cancelled sale is unwound
    // (unit re-sellable) and its commission already reversed via COMMISSION_REFUND (netted below), so
    // its lingering schedule must NOT inflate contracted/overdue/debtors or surface a phantom debtor.
    const scoped = { schedule: { contract: { orgId, status: 'ACTIVE' as const } } };
    const activeContract = { contract: { orgId, status: 'ACTIVE' as const } };
    const [contracted, collected, overdue, scheduleCount, debtorCount, debit, refund, wallet] =
      await Promise.all([
        this.prisma.paymentInstallment.aggregate({ where: scoped, _sum: { amountSom: true } }),
        this.prisma.paymentInstallment.aggregate({
          where: { ...scoped, status: 'PAID' },
          _sum: { amountSom: true },
        }),
        this.prisma.paymentInstallment.aggregate({
          where: { ...scoped, status: 'PENDING', dueDate: { lt: now } },
          _sum: { amountSom: true },
        }),
        this.prisma.paymentSchedule.count({ where: activeContract }),
        this.prisma.paymentSchedule.count({
          where: {
            ...activeContract,
            installments: { some: { status: 'PENDING', dueDate: { lt: now } } },
          },
        }),
        this.prisma.orgWalletTransaction.aggregate({
          where: { orgWallet: { orgId }, type: 'COMMISSION_DEBIT' },
          _sum: { amountSom: true },
        }),
        this.prisma.orgWalletTransaction.aggregate({
          where: { orgWallet: { orgId }, type: 'COMMISSION_REFUND' },
          _sum: { amountSom: true },
        }),
        this.prisma.orgWallet.findUnique({ where: { orgId }, select: { balanceSom: true } }),
      ]);

    const contractedSom = contracted._sum.amountSom ?? 0n;
    const collectedSom = collected._sum.amountSom ?? 0n;
    // Net commission is ≥0 by construction (every refund reverses a prior debit); clamp defensively
    // so a ledger anomaly can't emit a negative string that would fail the DTO's non-negative /^\d+$/.
    const commissionRaw = (debit._sum.amountSom ?? 0n) - (refund._sum.amountSom ?? 0n);
    const commissionPaid = commissionRaw < 0n ? 0n : commissionRaw;
    return {
      contractedSom: String(contractedSom),
      collectedSom: String(collectedSom),
      outstandingSom: String(contractedSom - collectedSom),
      overdueSom: String(overdue._sum.amountSom ?? 0n),
      scheduleCount,
      debtorCount,
      commissionPaidSom: String(commissionPaid),
      orgBalanceSom: String(wallet?.balanceSom ?? 0n),
    };
  }

  /** The org's contracts with ≥1 overdue installment, most-overdue first. */
  async debtors(orgId: string): Promise<DebtorRow[]> {
    const now = new Date();
    const schedules = await this.prisma.paymentSchedule.findMany({
      where: {
        // ACTIVE contracts only — a cancelled sale is not a live debt (see summary()).
        contract: { orgId, status: 'ACTIVE' },
        installments: { some: { status: 'PENDING', dueDate: { lt: now } } },
      },
      include: {
        contract: { select: { id: true, number: true, buyerName: true, buyerPhone: true } },
        installments: { select: { amountSom: true, status: true, dueDate: true } },
      },
    });
    return schedules
      .map((s) => {
        const overdue = s.installments.filter((it) => it.status === 'PENDING' && it.dueDate < now);
        const overdueSom = overdue.reduce((a, it) => a + it.amountSom, 0n);
        const oldestDueDate = overdue.reduce(
          (min, it) => (it.dueDate < min ? it.dueDate : min),
          overdue[0]!.dueDate, // `some` guarantees ≥1 overdue → non-empty
        );
        const remainingSom = s.installments.reduce(
          (a, it) => (it.status !== 'PAID' ? a + it.amountSom : a),
          0n,
        );
        return {
          contractId: s.contract.id,
          contractNumber: s.contract.number,
          buyerName: s.contract.buyerName,
          buyerPhone: s.contract.buyerPhone,
          overdueSom: String(overdueSom),
          oldestDueDate: oldestDueDate.toISOString(),
          remainingSom: String(remainingSom),
        };
      })
      .sort((a, b) => a.oldestDueDate.localeCompare(b.oldestDueDate));
  }
}
