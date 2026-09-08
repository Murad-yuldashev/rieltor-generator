import { Link } from 'react-router';
import type { DebtorRow, FinanceSummary } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { useDebtors, useFinanceSummary } from '@/features/finance';
import { CabinetNav } from '@/widgets/cabinet-nav';
import { cn } from '@/shared/lib/cn';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink align-top';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';

/**
 * Moliya (`/finance`) — the developer organization's finance dashboard. The summary
 * cards total the payment schedules (contracted / collected / outstanding / overdue)
 * plus the net commission and the org wallet balance; the table lists every debtor —
 * a contract with overdue installments — linking through to its detail.
 */
export function FinancePage() {
  const { data: summary, isPending, isError } = useFinanceSummary();

  return (
    <main className={SHELL}>
      <CabinetNav />

      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Moliya</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !summary ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Moliyani yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : (
        <>
          <FinanceCards summary={summary} />
          <DebtorTable />
        </>
      )}
    </main>
  );
}

/** The six summary cards over the finance snapshot. */
function FinanceCards({ summary }: { summary: FinanceSummary }) {
  // A negative org balance is a DEBT. orgBalanceSom is a BigInt-as-string that may not
  // fit in a number, so the sign is read off the string ('-' prefix), never Number()-ed.
  const isDebt = summary.orgBalanceSom.startsWith('-');
  const hasOverdue = summary.overdueSom !== '0';

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <FinanceCard label="Kontraktlangan" value={formatPriceSom(summary.contractedSom, 'SALE')} />
      <FinanceCard label="Yig'ilgan" value={formatPriceSom(summary.collectedSom, 'SALE')} />
      <FinanceCard label="Qoldiq" value={formatPriceSom(summary.outstandingSom, 'SALE')} />
      <FinanceCard
        label="Muddati o'tgan"
        value={formatPriceSom(summary.overdueSom, 'SALE')}
        tone={hasOverdue ? 'rose' : 'ink'}
      />
      <FinanceCard
        label="Net komissiya"
        value={formatPriceSom(summary.commissionPaidSom, 'SALE')}
      />
      <FinanceCard
        label="Balans"
        value={formatPriceSom(summary.orgBalanceSom, 'SALE')}
        badge={isDebt ? 'Qarz' : undefined}
        tone={isDebt ? 'rose' : 'ink'}
      />
    </section>
  );
}

/** One summary card. `tone='rose'` paints the value red; `badge` adds a pill under it. */
function FinanceCard({
  label,
  value,
  tone = 'ink',
  badge,
}: {
  label: string;
  value: string;
  tone?: 'ink' | 'rose';
  badge?: string;
}) {
  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <p className="text-[12px] font-semibold text-ink-2">{label}</p>
      <p
        className={cn(
          'mt-1.5 text-[18px] font-extrabold leading-tight',
          tone === 'rose' ? 'text-brand-rose' : 'text-ink',
        )}
      >
        {value}
      </p>
      {badge && (
        <span className="mt-2 inline-flex rounded-full bg-brand-rose/10 px-2.5 py-1 text-[12px] font-bold text-brand-rose">
          {badge}
        </span>
      )}
    </div>
  );
}

/** The debtor table — its own query so a debtor refetch never repaints the cards. */
function DebtorTable() {
  const { data: debtors, isPending, isError } = useDebtors();

  return (
    <section>
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">Qarzdorlar</h2>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !debtors ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Qarzdorlarni yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : debtors.length === 0 ? (
        <p className="text-[14px] text-ink-3">Qarzdor yo'q</p>
      ) : (
        <div className="rounded-card bg-card p-5 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={HEAD}>Shartnoma</th>
                  <th className={HEAD}>Xaridor</th>
                  <th className={HEAD}>Qarz</th>
                  <th className={HEAD}>Eng eski muddat</th>
                  <th className={HEAD}>Qoldiq</th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((debtor) => (
                  <DebtorRowItem key={debtor.contractId} debtor={debtor} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

/** One debtor row; the contract number links through to its detail page. */
function DebtorRowItem({ debtor }: { debtor: DebtorRow }) {
  return (
    <tr className="border-b border-line">
      <td className={cn(CELL, 'font-semibold')}>
        <Link to={`/contracts/${debtor.contractId}`} className="text-accent hover:underline">
          {debtor.contractNumber}
        </Link>
      </td>
      <td className={CELL}>
        <span className="block text-ink">{debtor.buyerName}</span>
        <span className="block text-[12px] text-ink-3">{debtor.buyerPhone}</span>
      </td>
      <td className={cn(CELL, 'font-bold text-brand-rose')}>
        {formatPriceSom(debtor.overdueSom, 'SALE')}
      </td>
      <td className={CELL}>{new Date(debtor.oldestDueDate).toLocaleDateString('uz-UZ')}</td>
      <td className={CELL}>{formatPriceSom(debtor.remainingSom, 'SALE')}</td>
    </tr>
  );
}
