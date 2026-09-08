import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import type { ContractRow } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import {
  CONTRACT_STATUS_BADGE,
  CONTRACT_STATUS_LABELS,
  useCancelContract,
  useContract,
  useSignContract,
} from '@/features/contracts';
import { CabinetNav } from '@/widgets/cabinet-nav';
import { cn } from '@/shared/lib/cn';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';

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
      <CabinetNav />
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

/** The field list, status, and sign/cancel controls for a loaded contract. */
function ContractDetailView({ contract }: { contract: ContractRow }) {
  const sign = useSignContract(contract.id);
  const cancel = useCancelContract(contract.id);
  const [reason, setReason] = useState('');
  const isActive = contract.status === 'ACTIVE';
  const isCancelled = contract.status === 'CANCELLED';
  const canSign = isActive && contract.signedAt === null;
  const trimmedReason = reason.trim();

  return (
    <>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
        Shartnoma № {contract.number}
      </h1>

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

        {isCancelled && (
          <>
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
          </>
        )}
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
    </>
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
