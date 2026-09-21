import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { ContractRow, ContractStatus } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { CONTRACT_STATUS_BADGE, CONTRACT_STATUS_LABELS, useContracts } from '@/features/contracts';
import { cn } from '@/shared/lib/cn';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

const SHELL = 'flex flex-col gap-5';
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink align-top';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';

/** Display + filter order for the status chips (contracts are ACTIVE | CANCELLED). */
const CONTRACT_STATUS_ORDER: ContractStatus[] = ['ACTIVE', 'CANCELLED'];

/** Pill button for the status filter row (mirrors the web requests-page chip idiom). */
function chipClass(active: boolean) {
  return cn(
    'shrink-0 rounded-full border px-[15px] py-2.5 text-[13.5px] font-semibold transition-colors',
    active
      ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30'
      : 'border-line bg-card text-ink-2',
  );
}

/**
 * Shartnomalar (`/contracts`) — the org-wide contracts list. Each row shows the
 * contract number (a link to its detail), the buyer, the building + unit, the
 * agreed amount, a status badge, and the created date.
 */
export function ContractsPage() {
  const { data: contracts, isPending, isError } = useContracts();

  return (
    <main className={SHELL}>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Shartnomalar</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !contracts ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Shartnomalarni yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : contracts.length === 0 ? (
        <p className="text-[14px] text-ink-3">Hozircha shartnoma yo'q</p>
      ) : (
        <ContractsBoard contracts={contracts} />
      )}
    </main>
  );
}

/** Summary stat row + status filter chips + table over the loaded contracts. */
function ContractsBoard({ contracts }: { contracts: ContractRow[] }) {
  const [statusFilter, setStatusFilter] = useState<ContractStatus | null>(null);

  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const cancelledCount = contracts.filter((c) => c.status === 'CANCELLED').length;

  // Σ agreedAmount over ACTIVE contracts via BigInt — the so'm values may exceed
  // Number.MAX_SAFE_INTEGER, so they are summed as BigInt and never Number()-ed.
  let activeTotal = 0n;
  for (const contract of contracts) {
    if (contract.status === 'ACTIVE' && contract.agreedAmount !== null) {
      activeTotal += BigInt(contract.agreedAmount);
    }
  }

  const visible = statusFilter ? contracts.filter((c) => c.status === statusFilter) : contracts;

  return (
    <>
      <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Jami" value={contracts.length} />
        <StatTile label="Faol" value={activeCount} tone="green" />
        <StatTile label="Bekor qilingan" value={cancelledCount} />
        <StatTile label="Umumiy summa" value={formatPriceSom(activeTotal.toString(), 'SALE')} />
      </StatTileRow>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className={chipClass(statusFilter === null)}
        >
          Barchasi
        </button>
        {CONTRACT_STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={chipClass(statusFilter === status)}
          >
            {CONTRACT_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <section className="rounded-card bg-card p-5 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={HEAD}>Raqam</th>
                <th className={HEAD}>Xaridor</th>
                <th className={HEAD}>Bino / Xonadon</th>
                <th className={cn(HEAD, 'lg:text-right')}>Summa</th>
                <th className={HEAD}>Holat</th>
                <th className={HEAD}>Sana</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className={cn(CELL, 'text-ink-3')} colSpan={6}>
                    Ushbu holatda shartnoma yo'q
                  </td>
                </tr>
              ) : (
                visible.map((contract) => <ContractRowItem key={contract.id} contract={contract} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/**
 * One contract row. The whole row navigates to the contract detail (mouse
 * affordance); the number cell keeps its real `<Link>` so keyboard users still
 * reach the detail — its click stops propagating to avoid a redundant navigate.
 */
function ContractRowItem({ contract }: { contract: ContractRow }) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/contracts/${contract.id}`)}
      className="cursor-pointer border-b border-line transition-colors hover:bg-surface"
    >
      <td className={cn(CELL, 'font-semibold')}>
        <Link
          to={`/contracts/${contract.id}`}
          onClick={(event) => event.stopPropagation()}
          className="text-accent hover:underline"
        >
          {contract.number}
        </Link>
      </td>
      <td className={CELL}>
        <span className="block text-ink">{contract.buyerName}</span>
        <span className="block text-[12px] text-ink-3">{contract.buyerPhone}</span>
      </td>
      <td className={CELL}>
        <span className="block text-ink">{contract.buildingName}</span>
        <span className="block text-[12px] text-ink-3">№ {contract.unitNumber}</span>
      </td>
      <td className={cn(CELL, 'lg:text-right')}>
        {contract.agreedAmount === null ? '—' : formatPriceSom(contract.agreedAmount, 'SALE')}
      </td>
      <td className={CELL}>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[12px] font-semibold',
            CONTRACT_STATUS_BADGE[contract.status],
          )}
        >
          {CONTRACT_STATUS_LABELS[contract.status]}
        </span>
      </td>
      <td className={CELL}>{new Date(contract.createdAt).toLocaleDateString('uz-UZ')}</td>
    </tr>
  );
}
