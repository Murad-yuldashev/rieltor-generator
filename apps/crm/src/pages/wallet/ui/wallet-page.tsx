import type { OrgWalletTxRow } from '@rieltor/shared';
import { TOPUP_PACKAGES, formatListedAt, formatPriceSom } from '@rieltor/shared';
import { useOrgTopup, useOrgWallet } from '@/features/wallet';
import { CabinetNav } from '@/widgets/cabinet-nav';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';

/** ISO timestamp → "30-avgust". Reuses the shared date formatter on the date part. */
function formatTxDate(createdAt: string): string {
  return formatListedAt(createdAt.slice(0, 10));
}

/**
 * "Hisob" (`/wallet`) — the developer organization's wallet. Shows the current
 * balance (which MAY be a debt), the preset top-up buttons (a STUB payment that
 * credits the package), and the transaction ledger: TOPUP as a green credit,
 * COMMISSION_DEBIT as a red debit for a booking's commission.
 */
export function WalletPage() {
  const { data: wallet, isPending, isError } = useOrgWallet();
  const topup = useOrgTopup();

  // A negative balance is a DEBT. balanceSom is a BigInt-as-string that may not fit
  // in a number, so the sign is read off the string ('-' prefix), never Number()-ed.
  const isDebt = wallet ? wallet.balanceSom.startsWith('-') : false;

  return (
    <main className={SHELL}>
      <CabinetNav />

      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Hisob</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !wallet ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Hisobni yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : (
        <>
          <section className="rounded-card bg-card p-5 shadow-card">
            <p className="text-[13px] font-semibold text-ink-2">Balans</p>
            <p
              className={
                isDebt
                  ? 'mt-1 text-[28px] font-extrabold leading-none text-brand-rose'
                  : 'mt-1 text-[28px] font-extrabold leading-none text-ink'
              }
            >
              {formatPriceSom(wallet.balanceSom, 'SALE')}
            </p>
            {isDebt && (
              <span className="mt-2 inline-flex rounded-full bg-brand-rose/10 px-2.5 py-1 text-[12px] font-bold text-brand-rose">
                Qarz
              </span>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">
              Hisobni to'ldirish
            </h2>
            <div className="grid grid-cols-3 gap-3">
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

          <section>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">
              Amaliyotlar tarixi
            </h2>
            {wallet.transactions.length === 0 ? (
              <div className="rounded-card bg-card p-8 text-center shadow-card">
                <p className="text-[15px] font-bold text-ink">Hali amaliyot yo'q</p>
                <p className="mt-1 text-[13px] font-medium text-ink-2">
                  Hisobni to'ldiring — komissiyalar shu yerda ko'rinadi.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {wallet.transactions.map((tx) => (
                  <WalletTxItem key={tx.id} tx={tx} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

/**
 * One ledger row. `amountSom` is always non-negative; direction comes from `type` —
 * TOPUP and COMMISSION_REFUND are green credits ("To'ldirish" / "Komissiya qaytarildi", +),
 * COMMISSION_DEBIT a red debit ("Komissiya to'lovi", −).
 */
function WalletTxItem({ tx }: { tx: OrgWalletTxRow }) {
  const isCredit = tx.type === 'TOPUP' || tx.type === 'COMMISSION_REFUND';
  const label =
    tx.type === 'TOPUP'
      ? "To'ldirish"
      : tx.type === 'COMMISSION_REFUND'
        ? 'Komissiya qaytarildi'
        : "Komissiya to'lovi";
  const amount = formatPriceSom(tx.amountSom, 'SALE');

  return (
    <li className="flex items-center justify-between rounded-card bg-card px-4 py-3.5 shadow-card">
      <div>
        <p className="text-[15px] font-semibold text-ink">{label}</p>
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
