import { useNavigate } from 'react-router';
import { useBecomeRealtor } from '@/features/subscription';

const PERKS = [
  'Mijozlar uchun shaxsiy eslatmalar va to‘plamlar',
  'E’lonlarni ko‘rib chiqish va saqlash',
  '14 kun davomida hech qanday to‘lovsiz',
];

/**
 * Shown by the cabinet gate to a plain USER. A single CTA upgrades the account to
 * REALTOR and opens a 14-day free trial, then routes to the dashboard. No
 * subscription is fetched here — the user does not have one yet.
 */
export function BecomeRealtorPage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending, isError } = useBecomeRealtor();

  async function handleBecomeRealtor() {
    await mutateAsync();
    // The mutation seeds role → REALTOR and the trial view, so the gate now
    // resolves straight to the dashboard.
    void navigate('/', { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 bg-surface px-5 py-12">
      <div className="rounded-card bg-card p-6 shadow-card">
        <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-[12px] font-bold text-accent">
          14 kun bepul
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink">
          Rieltor kabinetini oching
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          Rieltor bo‘lib, mijozlaringiz uchun e’lonlar bilan ishlashni boshlang. Dastlabki 14 kun
          mutlaqo bepul — karta talab qilinmaydi.
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-[14px] text-ink">
              <span className="mt-0.5 text-accent" aria-hidden="true">
                ✓
              </span>
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleBecomeRealtor}
          disabled={isPending}
          className="mt-6 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {isPending ? 'Ochilmoqda...' : 'Rieltor bo‘lish (14 kun bepul)'}
        </button>

        {isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            Xatolik yuz berdi. Qayta urinib ko‘ring.
          </p>
        )}
      </div>
    </main>
  );
}
