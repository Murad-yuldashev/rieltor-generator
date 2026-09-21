import type { BookingRow, Complex, ContractRow, FinanceSummary } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

/** Hold-until window (ms) inside which an ACTIVE booking counts as "expiring soon". */
const EXPIRING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/** Placeholder shown in a money tile while its finance query is still loading. */
const MONEY_PLACEHOLDER = '—';

/**
 * The six dashboard KPI tiles, all derived client-side from data the cabinet
 * already loads. The three secondary queries can still be resolving when the org
 * (the page's gate) is ready, so every source is optional and degrades to 0 / a
 * placeholder rather than blocking the whole dashboard.
 */
export function DashboardKpis({
  complexes,
  bookings,
  contracts,
  summary,
}: {
  complexes: Complex[] | undefined;
  bookings: BookingRow[] | undefined;
  contracts: ContractRow[] | undefined;
  summary: FinanceSummary | undefined;
}) {
  const complexList = complexes ?? [];
  const bookingList = bookings ?? [];
  const contractList = contracts ?? [];

  const publishedCount = complexList.filter((c) => c.publishStatus === 'PUBLISHED').length;
  const draftCount = complexList.length - publishedCount;

  const activeBookings = bookingList.filter((b) => b.status === 'ACTIVE');
  const expiringSoon = countExpiringSoon(activeBookings);

  const activeContracts = contractList.filter((c) => c.status === 'ACTIVE').length;

  // A negative org balance is a DEBT. orgBalanceSom is a BigInt-as-string that may not
  // fit in a number, so the sign is read off the string ('-' prefix), never Number()-ed.
  const isDebt = summary != null && summary.orgBalanceSom.startsWith('-');
  const hasOverdue = summary != null && summary.overdueSom !== '0';

  return (
    <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 desk:grid-cols-6">
      <StatTile
        label="Majmualar"
        value={complexList.length}
        sub={`${publishedCount} e'lon · ${draftCount} qoralama`}
      />
      <StatTile
        label="Faol bandlar"
        value={activeBookings.length}
        tone={expiringSoon > 0 ? 'amber' : 'default'}
        sub={expiringSoon > 0 ? `${expiringSoon} muddati tugayapti` : undefined}
      />
      <StatTile label="Shartnomalar" value={contractList.length} sub={`${activeContracts} faol`} />
      <StatTile
        label="Yig'ilgan"
        value={summary ? formatPriceSom(summary.collectedSom, 'SALE') : MONEY_PLACEHOLDER}
        tone="green"
      />
      <StatTile
        label="Muddati o'tgan"
        value={summary ? formatPriceSom(summary.overdueSom, 'SALE') : MONEY_PLACEHOLDER}
        tone={hasOverdue ? 'rose' : 'default'}
      />
      <StatTile
        label="Balans"
        value={summary ? formatPriceSom(summary.orgBalanceSom, 'SALE') : MONEY_PLACEHOLDER}
        badge={isDebt ? 'Qarz' : undefined}
        tone={isDebt ? 'rose' : 'default'}
      />
    </StatTileRow>
  );
}

/** ACTIVE holds whose `holdUntil` falls within the next three days (a renewal nudge). */
function countExpiringSoon(activeBookings: BookingRow[]): number {
  const threshold = Date.now() + EXPIRING_WINDOW_MS;
  return activeBookings.filter((b) => {
    const holdUntilMs = new Date(b.holdUntil).getTime();
    return !Number.isNaN(holdUntilMs) && holdUntilMs <= threshold;
  }).length;
}
