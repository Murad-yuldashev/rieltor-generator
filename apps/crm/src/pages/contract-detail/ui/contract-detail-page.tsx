import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import type { ContractRow, InstallmentStatus } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import {
  CONTRACT_STATUS_BADGE,
  CONTRACT_STATUS_LABELS,
  useCancelContract,
  useContract,
  useSignContract,
} from '@/features/contracts';
import {
  useCreateSchedule,
  useDeleteSchedule,
  usePayInstallment,
  usePaymentSchedule,
} from '@/features/payment-schedule';
import { cn } from '@/shared/lib/cn';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

/** Uzbek labels for an installment's status (UI copy only). */
const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  PENDING: 'Kutilmoqda',
  PAID: 'To’langan',
};

/** Badge tint per installment status. */
const INSTALLMENT_STATUS_BADGE: Record<InstallmentStatus, string> = {
  PENDING: 'bg-ink-3/10 text-ink-3',
  PAID: 'bg-brand-green/10 text-brand-green',
};

const SHELL = 'flex flex-col gap-5';

/** ISO timestamp → local date (uz-UZ). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

/**
 * Contract detail (`/contracts/:id`). The outer component resolves the fetch and
 * hands the loaded contract to the view, which owns the sign action.
 */
export function ContractDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: contract, isPending, isError } = useContract(id);

  return (
    <main className={SHELL}>
      <Link to="/contracts" className="text-[13px] font-semibold text-accent">
        &lsaquo; Shartnomalar
      </Link>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !contract ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Shartnomani yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : (
        <ContractDetailView key={contract.id} contract={contract} />
      )}
    </main>
  );
}

/**
 * The loaded contract laid out as schedule-first main + a sticky action rail.
 *
 * Phone (<lg) stays a single column: both wrappers below dissolve to `display: contents`,
 * so their children join the one stack and `order-*` keeps the original source order
 * (facts → sign → cancel → schedule). From lg the MAIN (schedule) takes the wide column
 * and the ASIDE (facts + actions) the sticky 360px rail.
 */
function ContractDetailView({ contract }: { contract: ContractRow }) {
  const sign = useSignContract(contract.id);
  const cancel = useCancelContract(contract.id);
  const [reason, setReason] = useState('');
  const isActive = contract.status === 'ACTIVE';
  const canSign = isActive && contract.signedAt === null;
  const trimmedReason = reason.trim();

  return (
    <>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
        Shartnoma № {contract.number}
      </h1>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        {/* MAIN — the data-heavy payment schedule (or, for a cancelled contract, a
            placeholder so the two-column layout is never lopsided). On phone it sinks
            to the end of the stack via `order-last`. */}
        <div className="order-last flex min-w-0 flex-col gap-5 lg:order-none">
          {isActive ? (
            <ScheduleSection contractId={contract.id} />
          ) : (
            <CancelledSummary contract={contract} />
          )}
        </div>

        {/* STICKY ASIDE — the contract facts + status badge + sign/cancel action cards.
            `contents` on phone lets the cards flow into the single stack in source order. */}
        <aside className="contents lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-5">
          <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card">
            <Field label="Xaridor">
              <span className="block text-ink">{contract.buyerName}</span>
              <span className="block text-[13px] text-ink-3">{contract.buyerPhone}</span>
            </Field>

            <Field label="Xonadon">
              {contract.buildingName} · {contract.unitNumber}-xonadon
            </Field>

            <Field label="Summa">
              {contract.agreedAmount === null ? '—' : formatPriceSom(contract.agreedAmount, 'SALE')}
            </Field>

            <Field label="Valyuta">{contract.currency}</Field>

            <Field label="Holat">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold',
                  CONTRACT_STATUS_BADGE[contract.status],
                )}
              >
                {CONTRACT_STATUS_LABELS[contract.status]}
              </span>
            </Field>

            <Field label="Yaratilgan">{formatDate(contract.createdAt)}</Field>

            <Field label="Imzolangan">
              {contract.signedAt === null ? (
                <span className="text-ink-3">Imzolanmagan</span>
              ) : (
                formatDate(contract.signedAt)
              )}
            </Field>
          </section>

          {canSign && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => sign.mutate()}
                disabled={sign.isPending}
                className="w-fit rounded-[12px] bg-accent px-5 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
              >
                {sign.isPending ? '...' : 'Imzolash'}
              </button>
              {sign.isError && (
                <p className="text-[13px] font-semibold text-brand-rose">
                  Imzolashda xatolik. Qayta urinib ko'ring.
                </p>
              )}
            </div>
          )}

          {isActive && (
            <div className="flex flex-col gap-2 rounded-card bg-card p-5 shadow-card">
              <p className="text-[13px] font-semibold text-ink-2">Shartnomani bekor qilish</p>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Bekor qilish sababi"
                rows={3}
                className="w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-[14px] text-ink"
              />
              <button
                type="button"
                onClick={() => cancel.mutate(trimmedReason)}
                disabled={cancel.isPending || trimmedReason === ''}
                className="w-fit rounded-[12px] bg-brand-rose px-5 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
              >
                {cancel.isPending ? '...' : 'Bekor qilish'}
              </button>
              {cancel.isError && (
                <p className="text-[13px] font-semibold text-brand-rose">
                  Bekor qilishda xatolik. Qayta urinib ko'ring.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

/**
 * MAIN placeholder for a cancelled contract: there is no schedule to show, so surface
 * the cancellation reason + date here to keep the two-column layout balanced.
 */
function CancelledSummary({ contract }: { contract: ContractRow }) {
  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-extrabold text-brand-rose">Shartnoma bekor qilingan</p>
        <p className="text-[13px] text-ink-2">
          Bekor qilingan shartnomada to'lov jadvali mavjud emas.
        </p>
      </div>

      <Field label="Bekor sababi">
        {contract.cancelReason === null ? (
          <span className="text-ink-3">—</span>
        ) : (
          contract.cancelReason
        )}
      </Field>

      <Field label="Bekor qilingan sana">
        {contract.cancelledAt === null ? (
          <span className="text-ink-3">—</span>
        ) : (
          formatDate(contract.cancelledAt)
        )}
      </Field>
    </section>
  );
}

/**
 * Payment-schedule block for an active contract: a create form when no schedule
 * exists yet, otherwise the summary + installments table with pay + delete controls.
 */
function ScheduleSection({ contractId }: { contractId: string }) {
  const { data, isPending, isError } = usePaymentSchedule(contractId);

  if (isPending) {
    return <p className="text-[15px] font-semibold text-ink-2">To'lov jadvali yuklanmoqda...</p>;
  }
  if (isError) {
    return (
      <p className="text-[13px] font-semibold text-brand-rose">
        To'lov jadvalini yuklab bo'lmadi. Qayta urinib ko'ring.
      </p>
    );
  }

  return data === null ? (
    <ScheduleCreateForm contractId={contractId} />
  ) : (
    <ScheduleTable contractId={contractId} schedule={data} />
  );
}

/** The create form shown when a contract has no schedule yet. */
function ScheduleCreateForm({ contractId }: { contractId: string }) {
  const create = useCreateSchedule(contractId);
  const [downPaymentSom, setDownPaymentSom] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [startDate, setStartDate] = useState('');

  const count = Number(installmentCount);
  const canSubmit =
    /^\d+$/.test(downPaymentSom) &&
    Number.isInteger(count) &&
    count >= 1 &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate);

  return (
    <section className="flex flex-col gap-3 rounded-card bg-card p-5 shadow-card">
      <p className="text-[15px] font-extrabold text-ink">To'lov jadvali</p>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-ink-2">Boshlang'ich to'lov (so'm)</span>
        <input
          type="text"
          inputMode="numeric"
          value={downPaymentSom}
          onChange={(event) => setDownPaymentSom(event.target.value)}
          placeholder="0"
          className="w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-[14px] text-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-ink-2">Ulushlar soni</span>
        <input
          type="number"
          min={1}
          value={installmentCount}
          onChange={(event) => setInstallmentCount(event.target.value)}
          placeholder="12"
          className="w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-[14px] text-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-ink-2">Boshlanish sanasi</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-[14px] text-ink"
        />
      </label>
      <button
        type="button"
        onClick={() => create.mutate({ downPaymentSom, installmentCount: count, startDate })}
        disabled={create.isPending || !canSubmit}
        className="w-fit rounded-[12px] bg-accent px-5 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
      >
        {create.isPending ? '...' : 'Jadval yaratish'}
      </button>
      {create.isError && (
        <p className="text-[13px] font-semibold text-brand-rose">
          Jadval yaratishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </section>
  );
}

/**
 * The loaded schedule: a summary tile group + a paid-progress bar, then the installments
 * table (per-row pay button) and a delete control while nothing is paid.
 */
function ScheduleTable({
  contractId,
  schedule,
}: {
  contractId: string;
  schedule: NonNullable<ReturnType<typeof usePaymentSchedule>['data']>;
}) {
  const pay = usePayInstallment(contractId);
  const remove = useDeleteSchedule(contractId);
  // Delete is allowed only while nothing is paid. Gate on the installments (not `paidSom === '0'`,
  // which would still show the button after a 0-som installment is paid and then 409 on click).
  const canDelete = schedule.installments.every((it) => it.status !== 'PAID');
  // Overdue = a still-PENDING installment whose due date is before today (date compare only).
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const remainingTone = schedule.remainingSom === '0' ? 'default' : 'amber';

  return (
    <>
      {/* Summary read straight off the view — no client-side money math. */}
      <StatTileRow className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Jami" value={formatPriceSom(schedule.totalSom, 'SALE')} />
        <StatTile label="To'langan" value={formatPriceSom(schedule.paidSom, 'SALE')} tone="green" />
        <StatTile
          label="Qolgan"
          value={formatPriceSom(schedule.remainingSom, 'SALE')}
          tone={remainingTone}
        />
      </StatTileRow>

      <PaidProgress paidSom={schedule.paidSom} totalSom={schedule.totalSom} />

      <section className="flex flex-col gap-3 rounded-card bg-card p-5 shadow-card">
        <p className="text-[15px] font-extrabold text-ink">To'lov jadvali</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="text-left text-[13px] font-semibold text-ink-2">
                <th className="py-2 pr-3">№</th>
                <th className="py-2 pr-3">Muddat</th>
                <th className="py-2 pr-3">Summa</th>
                <th className="py-2 pr-3">Holat</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {schedule.installments.map((installment) => {
                const isOverdue =
                  installment.status === 'PENDING' && new Date(installment.dueDate) < startOfToday;
                return (
                  <tr
                    key={installment.id}
                    className={cn('border-t border-line', isOverdue && 'bg-brand-rose/5')}
                  >
                    <td className="py-2 pr-3 text-ink">{installment.seq}</td>
                    <td
                      className={cn(
                        'py-2 pr-3',
                        isOverdue ? 'font-semibold text-brand-rose' : 'text-ink',
                      )}
                    >
                      {formatDate(installment.dueDate)}
                    </td>
                    <td className="py-2 pr-3 text-ink">
                      {formatPriceSom(installment.amountSom, 'SALE')}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold',
                          isOverdue
                            ? 'bg-brand-rose/10 text-brand-rose'
                            : INSTALLMENT_STATUS_BADGE[installment.status],
                        )}
                      >
                        {isOverdue
                          ? 'Muddati o‘tgan'
                          : INSTALLMENT_STATUS_LABELS[installment.status]}
                      </span>
                    </td>
                    <td className="py-2">
                      {installment.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => pay.mutate(installment.id)}
                          disabled={pay.isPending}
                          className="rounded-[10px] bg-accent px-3 py-1.5 text-[13px] font-extrabold text-white disabled:opacity-60"
                        >
                          To'landi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pay.isError && (
          <p className="text-[13px] font-semibold text-brand-rose">
            To'lovni belgilashda xatolik. Qayta urinib ko'ring.
          </p>
        )}

        {canDelete && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="w-fit rounded-[12px] bg-brand-rose px-5 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
            >
              {remove.isPending ? '...' : "Jadvalni o'chirish"}
            </button>
            {remove.isError && (
              <p className="text-[13px] font-semibold text-brand-rose">
                Jadvalni o'chirishda xatolik. Qayta urinib ko'ring.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

/**
 * Paid-progress bar — pure CSS, blue fill (no chart library). The percentage is computed
 * in BigInt (paid/total may exceed a JS number), converting only the bounded 0–10000
 * basis-point result to a number for the bar width.
 */
function PaidProgress({ paidSom, totalSom }: { paidSom: string; totalSom: string }) {
  const total = BigInt(totalSom);
  const paid = BigInt(paidSom);
  const bps = total > 0n ? Number((paid * 10_000n) / total) : 0;
  const percent = Math.min(100, Math.max(0, bps / 100));

  return (
    <section className="rounded-card bg-card p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">To'langan ulush</h2>
        <span className="text-[15px] font-extrabold text-accent">{percent.toFixed(0)}%</span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2.5 text-[13px] text-ink-2">
        <span className="font-bold text-ink">{formatPriceSom(paidSom, 'SALE')}</span>
        {' / '}
        {formatPriceSom(totalSom, 'SALE')}
      </p>
    </section>
  );
}

/** One label + value row in the contract detail card. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink-2">{label}</p>
      <div className="mt-1 text-[15px] text-ink">{children}</div>
    </div>
  );
}
