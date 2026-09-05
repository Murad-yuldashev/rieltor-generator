import { Link } from 'react-router';
import type { ContractRow } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { CONTRACT_STATUS_BADGE, CONTRACT_STATUS_LABELS, useContracts } from '@/features/contracts';
import { CabinetNav } from '@/widgets/cabinet-nav';
import { cn } from '@/shared/lib/cn';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink align-top';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';

/**
 * Shartnomalar (`/contracts`) — the org-wide contracts list. Each row shows the
 * contract number (a link to its detail), the buyer, the building + unit, the
 * agreed amount, a status badge, and the created date.
 */
export function ContractsPage() {
  const { data: contracts, isPending, isError } = useContracts();

  return (
    <main className={SHELL}>
      <CabinetNav />

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
        <section className="rounded-card bg-card p-5 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={HEAD}>Raqam</th>
                  <th className={HEAD}>Xaridor</th>
                  <th className={HEAD}>Bino / Xonadon</th>
                  <th className={HEAD}>Summa</th>
                  <th className={HEAD}>Holat</th>
                  <th className={HEAD}>Sana</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <ContractRowItem key={contract.id} contract={contract} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

/** One contract row; the number cell links through to the contract detail. */
function ContractRowItem({ contract }: { contract: ContractRow }) {
  return (
    <tr className="border-b border-line">
      <td className={cn(CELL, 'font-semibold')}>
        <Link to={`/contracts/${contract.id}`} className="text-accent">
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
      <td className={CELL}>
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
