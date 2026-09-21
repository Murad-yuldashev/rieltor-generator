import { Link } from 'react-router';
import type { DebtorRow, FinanceSummary } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { useDebtors, useFinanceSummary } from '@/features/finance';
import { FinanceInsight } from '@/features/finance-insight';
import { cn } from '@/shared/lib/cn';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

const SHELL = 'flex flex-col gap-5';
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink align-top';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';

/**
 * Moliya (`/finance`) — the developer organization's finance dashboard. A six-tile KPI
 * row totals the payment schedules (contracted / collected / outstanding / overdue) plus
 * the net commission and the org wallet balance, with a slim strip surfacing the schedule
 * and debtor counts. Below, a main+sticky-aside band puts the debtor table and a
 * collection-composition bar in the MAIN column and the AI-tahlil insight panel and a
 * collection-health meter in the sticky ASIDE. On phone the `contents` wrappers dissolve
 * so everything stacks in a single flex column.
 */
export function FinancePage() {
  const { data: summary, isPending, isError } = useFinanceSummary();

  return (
    <main className={SHELL}>
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
          <ScalarStrip summary={summary} />

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6 desk:grid-cols-[1fr_380px]">
            {/* MAIN — the debtor table (first-class) + the collection-composition bar. */}
            <div className="contents lg:flex lg:flex-col lg:gap-5">
              <DebtorTable />
              <CollectionComposition
                collectedSom={summary.collectedSom}
                outstandingSom={summary.outstandingSom}
                overdueSom={summary.overdueSom}
              />
            </div>

            {/* ASIDE — the AI-tahlil insight panel + the collection-health meter. */}
            <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5">
              <FinanceInsight />
              <CollectionHealth
                collectedSom={summary.collectedSom}
                contractedSom={summary.contractedSom}
              />
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

/** The six summary tiles over the finance snapshot — one desk row at `lg`. */
function FinanceCards({ summary }: { summary: FinanceSummary }) {
  // A negative org balance is a DEBT. orgBalanceSom is a BigInt-as-string that may not
  // fit in a number, so the sign is read off the string ('-' prefix), never Number()-ed.
  const isDebt = summary.orgBalanceSom.startsWith('-');
  const hasOverdue = summary.overdueSom !== '0';

  return (
    <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <StatTile label="Kontraktlangan" value={formatPriceSom(summary.contractedSom, 'SALE')} />
      <StatTile
        label="Yig'ilgan"
        value={formatPriceSom(summary.collectedSom, 'SALE')}
        tone="green"
      />
      <StatTile label="Qoldiq" value={formatPriceSom(summary.outstandingSom, 'SALE')} />
      <StatTile
        label="Muddati o'tgan"
        value={formatPriceSom(summary.overdueSom, 'SALE')}
        tone={hasOverdue ? 'rose' : 'default'}
      />
      <StatTile label="Net komissiya" value={formatPriceSom(summary.commissionPaidSom, 'SALE')} />
      <StatTile
        label="Balans"
        value={formatPriceSom(summary.orgBalanceSom, 'SALE')}
        badge={isDebt ? 'Qarz' : undefined}
        tone={isDebt ? 'rose' : 'default'}
      />
    </StatTileRow>
  );
}

/** A slim strip surfacing the two count scalars the KPI tiles don't show. */
function ScalarStrip({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-card bg-card px-5 py-3 text-[13px] shadow-card">
      <span className="text-ink-2">
        Faol jadvallar:{' '}
        <span className="font-bold text-ink">{summary.scheduleCount.toLocaleString('uz-UZ')}</span>
      </span>
      <span className="text-ink-2">
        Qarzdorlar:{' '}
        <span className="font-bold text-ink">{summary.debtorCount.toLocaleString('uz-UZ')}</span>
      </span>
    </div>
  );
}

/**
 * Collection-composition bar — how the collected / still-outstanding / overdue amounts
 * split the total. Pure CSS (no chart library): one flex track of three segments coloured
 * blue / amber / rose. Each share is computed in BigInt (the money strings may exceed a JS
 * number) as basis points, casting only the bounded 0–100 percent to a number for the width.
 */
function CollectionComposition({
  collectedSom,
  outstandingSom,
  overdueSom,
}: {
  collectedSom: string;
  outstandingSom: string;
  overdueSom: string;
}) {
  const collected = BigInt(collectedSom);
  const outstanding = BigInt(outstandingSom);
  const overdue = BigInt(overdueSom);
  const total = collected + outstanding + overdue;
  // Percent (0–100) of one segment via BigInt basis points, so raw money is never Number()-ed.
  const share = (part: bigint) => (total > 0n ? Number((part * 10_000n) / total) / 100 : 0);

  const segments = [
    { label: "Yig'ilgan", som: collectedSom, percent: share(collected), color: 'bg-accent' },
    { label: 'Qoldiq', som: outstandingSom, percent: share(outstanding), color: 'bg-brand-amber' },
    { label: "Muddati o'tgan", som: overdueSom, percent: share(overdue), color: 'bg-brand-rose' },
  ];

  return (
    <section className="rounded-card bg-card p-5 shadow-card">
      <h2 className="text-[15px] font-bold text-ink">Yig'ilganlik tarkibi</h2>

      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-line">
        {segments.map((s) => (
          <div key={s.label} className={cn('h-full', s.color)} style={{ width: `${s.percent}%` }} />
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[13px]">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.color)} />
            <span className="text-ink-2">{s.label}</span>
            <span className="ml-auto font-semibold text-ink">{formatPriceSom(s.som, 'SALE')}</span>
            <span className="w-11 text-right tabular-nums text-ink-3">{s.percent.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Collection-health meter — the share of the contracted value already collected. Pure CSS
 * blue-accent fill. The ratio is computed in BigInt (contracted / collected may exceed a JS
 * number), casting only the bounded 0–10000 basis-point result to a number for the width.
 */
function CollectionHealth({
  collectedSom,
  contractedSom,
}: {
  collectedSom: string;
  contractedSom: string;
}) {
  const contracted = BigInt(contractedSom);
  const collected = BigInt(collectedSom);
  const bps = contracted > 0n ? Number((collected * 10_000n) / contracted) : 0;
  const percent = Math.min(100, Math.max(0, bps / 100));

  return (
    <section className="rounded-card bg-card p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Yig'ilganlik darajasi</h2>
        <span className="text-[15px] font-extrabold text-accent">{percent.toFixed(0)}%</span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2.5 text-[13px] text-ink-2">
        <span className="font-bold text-ink">{formatPriceSom(collectedSom, 'SALE')}</span>
        {' / '}
        {formatPriceSom(contractedSom, 'SALE')}
      </p>
    </section>
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
