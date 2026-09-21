import { Link } from 'react-router';
import { formatPriceSom } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

/**
 * Compact wallet balance card (ASIDE) — the current prepaid balance with a top-up
 * link. A negative balance is a DEBT, so its sign is read off the BigInt-as-string
 * (never Number()-ed) and the value is painted rose with a "Qarz" pill.
 */
export function WalletCard({ balanceSom, className }: { balanceSom: string; className?: string }) {
  const isDebt = balanceSom.startsWith('-');

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Hisob balansi</h2>
        {isDebt && (
          <span className="shrink-0 rounded-full bg-brand-rose/10 px-3 py-1 text-[12px] font-bold text-brand-rose">
            Qarz
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-2 text-[24px] font-extrabold leading-tight',
          isDebt ? 'text-brand-rose' : 'text-ink',
        )}
      >
        {formatPriceSom(balanceSom, 'SALE')}
      </p>
      <Link
        to="/wallet"
        className="mt-4 flex w-full items-center justify-center rounded-[14px] bg-accent-soft px-6 py-3 text-[15px] font-extrabold text-accent"
      >
        To'ldirish
      </Link>
    </section>
  );
}
