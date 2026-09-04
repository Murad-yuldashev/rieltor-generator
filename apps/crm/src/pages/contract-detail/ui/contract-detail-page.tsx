import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import type { Contract, ContractStatus } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { useContract, useSignContract } from '@/features/contracts';
import { CabinetNav } from '@/widgets/cabinet-nav';
import { cn } from '@/shared/lib/cn';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';

/** Uzbek labels for a contract's lifecycle status (UI copy only). */
const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: 'Faol',
  CANCELLED: 'Bekor qilingan',
};

/** Badge tint per contract status. */
const CONTRACT_STATUS_BADGE: Record<ContractStatus, string> = {
  ACTIVE: 'bg-brand-green/10 text-brand-green',
  CANCELLED: 'bg-ink-3/10 text-ink-3',
};

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

/** The field list, status, and sign control for a loaded contract. */
function ContractDetailView({ contract }: { contract: Contract }) {
  const sign = useSignContract(contract.id);
  const canSign = contract.status === 'ACTIVE' && contract.signedAt === null;

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

        <Field label="Xonadon">{contract.unitId}</Field>

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
