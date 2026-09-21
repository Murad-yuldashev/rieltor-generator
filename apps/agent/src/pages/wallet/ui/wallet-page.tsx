import { TOPUP_PACKAGES, formatListedAt, formatPriceSom, type WalletTxRow } from '@rieltor/shared';
import { useTopup, useWallet } from '@/features/wallet';
import { cn } from '@/shared/lib/cn';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

const SHELL = 'flex flex-col gap-5';
// Table cell/head idiom reused from the shared ledger tables for the md+ view.
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink align-top';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';

/** ISO timestamp → "30-avgust". Reuses the shared date formatter on the date part. */
function formatTxDate(createdAt: string): string {
  return formatListedAt(createdAt.slice(0, 10));
}

/** TOPUP and COMMISSION are credits (green, +); LEAD_CLAIM and COMMISSION_CLAWBACK are debits (rose, −). */
function isCreditTx(type: WalletTxRow['type']): boolean {
  return type === 'TOPUP' || type === 'COMMISSION';
}

/** Uzbek label for a ledger row's type. */
function txTypeLabel(type: WalletTxRow['type']): string {
  if (type === 'TOPUP') return "To'ldirish";
  if (type === 'COMMISSION') return 'Komissiya';
  if (type === 'COMMISSION_CLAWBACK') return 'Komissiya qaytarib olindi';
  return 'Lid';
}

/**
 * Plain-text reference for a ledger row — never a link. A LEAD_CLAIM points at the
 * claimed lead; fixation-linked rows (COMMISSION, COMMISSION_CLAWBACK) point at the fixation.
 */
function txReference(tx: WalletTxRow): string {
  if (tx.type === 'LEAD_CLAIM' && tx.leadId) return `Lid · ${tx.leadId.slice(0, 8)}`;
  if (tx.fixationId) return `Fiksatsiya · ${tx.fixationId.slice(0, 8)}`;
  return '—';
}

/**
 * "Hisobim" (`/wallet`) — the realtor's prepaid wallet. Shows the current balance
 * (which MAY be a debt), the preset top-up buttons (a STUB payment that credits the
 * package), and the transaction ledger: TOPUP and COMMISSION as green credits,
 * LEAD_CLAIM and COMMISSION_CLAWBACK as rose debits.
 *
 * Desktop (lg+) splits into a MAIN ledger table + a sticky ASIDE (top-up + balance);
 * on phone the `contents` wrappers dissolve so everything shares one flex column,
 * ordered by `order-*` to keep the original single-column reading order (balance,
 * top-up, ledger card-list).
 */
export function WalletPage() {
  const { data: wallet, isPending, isError } = useWallet();
  const topup = useTopup();

  return (
    <main className={SHELL}>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Hisobim</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !wallet ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Hisobni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <>
          <WalletKpis transactions={wallet.transactions} />

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6 desk:grid-cols-[1fr_360px]">
            <div className="contents lg:flex lg:flex-col lg:gap-5">
              <LedgerSection transactions={wallet.transactions} className="order-3" />
            </div>

            <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5">
              <TopupPanel topup={topup} className="order-2 lg:order-1" />
              <BalanceCard balanceSom={wallet.balanceSom} className="order-1 lg:order-2" />
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

/**
 * The summary tiles derived client-side from the ledger. `amountSom` is a
 * non-negative BigInt-as-string that may exceed Number.MAX_SAFE_INTEGER, so the
 * sums are computed with BigInt and only stringified for `formatPriceSom`.
 */
function WalletKpis({ transactions }: { transactions: WalletTxRow[] }) {
  let toppedUp = 0n;
  let leadSpend = 0n;
  let commission = 0n;
  for (const tx of transactions) {
    const amount = BigInt(tx.amountSom);
    if (tx.type === 'TOPUP') toppedUp += amount;
    else if (tx.type === 'LEAD_CLAIM') leadSpend += amount;
    else if (tx.type === 'COMMISSION') commission += amount;
    else if (tx.type === 'COMMISSION_CLAWBACK') commission -= amount;
  }

  return (
    <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile
        label="Jami to'ldirilgan"
        value={formatPriceSom(toppedUp.toString(), 'SALE')}
        tone="green"
      />
      <StatTile label="Lead xarajati" value={formatPriceSom(leadSpend.toString(), 'SALE')} />
      <StatTile
        label="Komissiya"
        value={formatPriceSom(commission.toString(), 'SALE')}
        tone={commission < 0n ? 'rose' : 'green'}
      />
      <StatTile label="Amaliyotlar soni" value={String(transactions.length)} />
    </StatTileRow>
  );
}

/**
 * The ledger. Phone (<md) keeps the vertical card-list `<ul>`; from md+ it becomes
 * a real table (Sana / Turi / Miqdor + a plain-text reference cell). The reference
 * cell is a LABEL, not a link.
 */
function LedgerSection({
  transactions,
  className,
}: {
  transactions: WalletTxRow[];
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">
        Amaliyotlar tarixi
      </h2>

      {transactions.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card">
          <p className="text-[15px] font-bold text-ink">Hali amaliyot yo'q</p>
          <p className="mt-1 text-[13px] font-medium text-ink-2">
            Hisobni to'ldiring va lidlarni sotib oling.
          </p>
        </div>
      ) : (
        <>
          {/* Phone (<md): card list. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {transactions.map((tx) => (
              <WalletTxItem key={tx.id} tx={tx} />
            ))}
          </ul>

          {/* md+: real table reusing the shared ledger table styles. */}
          <div className="hidden rounded-card bg-card p-5 shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th className={HEAD}>Sana</th>
                    <th className={HEAD}>Turi</th>
                    <th className={HEAD}>Miqdor</th>
                    <th className={HEAD}>Havola</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <WalletTxTableRow key={tx.id} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * One ledger row as a card (phone). `amountSom` is always non-negative; direction
 * comes from `type` — credits are green (+), debits rose (−).
 */
function WalletTxItem({ tx }: { tx: WalletTxRow }) {
  const isCredit = isCreditTx(tx.type);
  const amount = formatPriceSom(tx.amountSom, 'SALE');

  return (
    <li className="flex items-center justify-between rounded-card bg-card px-4 py-3.5 shadow-card">
      <div>
        <p className="text-[15px] font-semibold text-ink">{txTypeLabel(tx.type)}</p>
        <p className="text-[13px] font-medium text-ink-2">{formatTxDate(tx.createdAt)}</p>
      </div>
      <p
        className={
          isCredit
            ? 'text-[15px] font-bold text-brand-green'
            : 'text-[15px] font-bold text-brand-rose'
        }
      >
        {isCredit ? `+${amount}` : `−${amount}`}
      </p>
    </li>
  );
}

/** One ledger row as a table row (md+). The reference cell is plain text, never a link. */
function WalletTxTableRow({ tx }: { tx: WalletTxRow }) {
  const isCredit = isCreditTx(tx.type);
  const amount = formatPriceSom(tx.amountSom, 'SALE');

  return (
    <tr className="border-b border-line">
      <td className={CELL}>{formatTxDate(tx.createdAt)}</td>
      <td className={cn(CELL, 'font-semibold')}>{txTypeLabel(tx.type)}</td>
      <td className={cn(CELL, 'font-bold', isCredit ? 'text-brand-green' : 'text-brand-rose')}>
        {isCredit ? `+${amount}` : `−${amount}`}
      </td>
      <td className={cn(CELL, 'text-ink-3')}>{txReference(tx)}</td>
    </tr>
  );
}

/** The top-up panel — packages as a 3-up grid on phone, restacked 1-up in the aside. */
function TopupPanel({
  topup,
  className,
}: {
  topup: ReturnType<typeof useTopup>;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">
        Hisobni to'ldirish
      </h2>
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {TOPUP_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => topup.mutate(pkg.id)}
            disabled={topup.isPending}
            className="rounded-card bg-card px-3 py-4 text-[14px] font-bold text-ink shadow-card disabled:opacity-50"
          >
            {formatPriceSom(pkg.amountSom, 'SALE')}
          </button>
        ))}
      </div>
      {topup.isError && (
        <p className="mt-3 text-[13px] font-semibold text-brand-rose">
          To'lovni amalga oshirib bo'lmadi. Qayta urinib ko'ring.
        </p>
      )}
    </section>
  );
}

/**
 * Compact balance card. A negative balance is a DEBT — the sign is read off the
 * BigInt-as-string ('-' prefix), never Number()-ed, and painted rose with a "Qarz" pill.
 */
function BalanceCard({ balanceSom, className }: { balanceSom: string; className?: string }) {
  const isDebt = balanceSom.startsWith('-');

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <p className="text-[13px] font-semibold text-ink-2">Balans</p>
      <p
        className={cn(
          'mt-1 text-[28px] font-extrabold leading-none',
          isDebt ? 'text-brand-rose' : 'text-ink',
        )}
      >
        {formatPriceSom(balanceSom, 'SALE')}
      </p>
      {isDebt && (
        <span className="mt-2 inline-flex rounded-full bg-brand-rose/10 px-2.5 py-1 text-[12px] font-bold text-brand-rose">
          Qarz
        </span>
      )}
    </section>
  );
}
