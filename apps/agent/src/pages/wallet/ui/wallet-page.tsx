import { Link } from 'react-router';
import { TOPUP_PACKAGES, formatListedAt, formatPriceSom } from '@rieltor/shared';
import { useTopup, useWallet } from '@/features/wallet';
import { Icon } from '@/shared/ui/icon';

/** ISO timestamp → "30-avgust". Reuses the shared date formatter on the date part. */
function formatTxDate(createdAt: string): string {
  return formatListedAt(createdAt.slice(0, 10));
}

/**
 * "Hisobim" — the realtor's prepaid wallet. Shows the current balance, the preset
 * top-up buttons (a STUB payment that credits the package), and the transaction
 * ledger: TOPUP and COMMISSION as green credits, LEAD_CLAIM as a debit for a claimed lead.
 */
export function WalletPage() {
  const { data: wallet, isPending, isError } = useWallet();
  const topup = useTopup();

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Hisobim</h1>
      </header>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !wallet ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Hisobni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <>
          <section className="mb-6 rounded-card bg-card p-5 shadow-card">
            <p className="text-[13px] font-semibold text-ink-2">Hisob</p>
            <p className="mt-1 text-[28px] font-extrabold leading-none text-ink">
              {formatPriceSom(wallet.balanceSom, 'SALE')}
            </p>
          </section>

          <section className="mb-6">
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
                  Hisobni to'ldiring va lidlarni sotib oling.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {wallet.transactions.map((tx) => {
                  // TOPUP and COMMISSION credit the wallet (green, +); LEAD_CLAIM debits it (−).
                  const isCredit = tx.type === 'TOPUP' || tx.type === 'COMMISSION';
                  const label =
                    tx.type === 'TOPUP'
                      ? "To'ldirish"
                      : tx.type === 'COMMISSION'
                        ? 'Komissiya'
                        : 'Lid';
                  const amount = formatPriceSom(tx.amountSom, 'SALE');
                  return (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between rounded-card bg-card px-4 py-3.5 shadow-card"
                    >
                      <div>
                        <p className="text-[15px] font-semibold text-ink">{label}</p>
                        <p className="text-[13px] font-medium text-ink-2">
                          {formatTxDate(tx.createdAt)}
                        </p>
                      </div>
                      <p
                        className={
                          isCredit
                            ? 'text-[15px] font-bold text-brand-green'
                            : 'text-[15px] font-bold text-ink'
                        }
                      >
                        {isCredit ? `+${amount}` : `−${amount} (lead)`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
