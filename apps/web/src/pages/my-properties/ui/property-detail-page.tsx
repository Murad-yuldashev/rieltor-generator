import { lazy, Suspense, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { formatPriceSom } from '@rieltor/shared';
import { LISTING_TYPE_META } from '@/entities/listing';
import { deleteTrackedProperty, trackedPropertyQuery } from '@/entities/tracked-property';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

// Lazy so Recharts stays out of the initial bundle (its own price-chart chunk).
const PriceChart = lazy(() => import('@/shared/ui/price-chart/price-chart'));

function BackLink() {
  return (
    <Link
      to="/my/properties"
      className="inline-flex items-center gap-1 text-[13px] font-bold text-ink-2 transition-colors hover:text-ink"
    >
      <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
      Mening uyim
    </Link>
  );
}

/**
 * `/my/properties/:id` — one tracked home: its latest estimate, a monthly delta
 * and the modeled + actual price-history chart. When the market has no
 * comparables (`estimateSom === '0'`) the chart is replaced by an honest empty
 * state rather than a flat zero line.
 */
export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isPending, isError } = useQuery({
    ...trackedPropertyQuery(id ?? ''),
    enabled: Boolean(id),
  });

  async function handleUntrack() {
    if (!id) return;
    if (!window.confirm('Bu uyni kuzatuvdan olib tashlaysizmi?')) return;
    setIsDeleting(true);
    try {
      await deleteTrackedProperty(id);
      await qc.invalidateQueries({ queryKey: ['tracked-properties'] });
      navigate('/my/properties');
    } catch {
      setIsDeleting(false);
    }
  }

  if (isPending) {
    return (
      <main className="px-4 pt-4 md:mx-auto md:max-w-2xl desk:max-w-2xl desk:px-0 desk:pt-5">
        <BackLink />
        <div className="mt-4 h-[120px] animate-pulse rounded-card bg-card" />
        <div className="mt-3 h-[220px] animate-pulse rounded-card bg-card" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="px-4 pt-4 md:mx-auto md:max-w-2xl desk:max-w-2xl desk:px-0 desk:pt-5">
        <BackLink />
        <div className="mt-4 rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
          <p className="text-[16px] font-extrabold tracking-tight">Uy topilmadi</p>
          <p className="mt-2 text-[14px] text-ink-2">
            Bu uy o'chirilgan bo'lishi yoki manzil noto'g'ri bo'lishi mumkin.
          </p>
        </div>
      </main>
    );
  }

  const { label, type, district, rooms, areaM2, estimateSom, deltaPct, snapshots } = data;
  const hasEstimate = estimateSom !== '0';
  const title = label ?? LISTING_TYPE_META[type].label;
  const up = deltaPct >= 0;

  return (
    <main className="px-4 pt-4 pb-4 desk:max-w-2xl desk:px-0 desk:pt-5">
      <BackLink />

      <section className="mt-4 rounded-card border border-line/60 bg-card p-5 shadow-card">
        <p className="text-[18px] font-extrabold tracking-tight">{title}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-ink-3">
          {LISTING_TYPE_META[type].label}
          {rooms !== null && ` · ${rooms} xona`} · {areaM2} m² ·{' '}
          {district.replace(/\s*tumani$/, '')}
        </p>

        <p className="mt-3 text-[13px] font-bold text-ink-2">Joriy taxminiy narx</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-[clamp(24px,7vw,32px)] leading-tight font-extrabold tracking-tight text-accent-dark">
            {hasEstimate ? formatPriceSom(estimateSom, 'SALE') : 'Ma’lumot yetarli emas'}
          </p>
          {hasEstimate && (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[13px] font-bold',
                up ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-rose/10 text-brand-rose',
              )}
            >
              {up ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(1)}% / oy
            </span>
          )}
        </div>
      </section>

      <section className="mt-3 rounded-card border border-line/60 bg-card p-4 shadow-card">
        <h2 className="text-[15px] font-extrabold tracking-tight">Narx tarixi</h2>

        {hasEstimate ? (
          <>
            <div className="mt-3">
              <Suspense
                fallback={<div className="h-[220px] animate-pulse rounded-card bg-surface" />}
              >
                <PriceChart snapshots={snapshots} />
              </Suspense>
            </div>
            <p className="mt-2 text-[12px] text-ink-3">Uzuq chiziq — modellashtirilgan taxmin</p>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-[32px]">🔍</p>
            <p className="mt-2 text-[15px] font-extrabold tracking-tight">Ma'lumot yetarli emas</p>
            <p className="mx-auto mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-ink-2">
              Bu tur va tuman bo'yicha bozorimizda hali sotuvdagi o'xshash e'lonlar yo'q. Bozor
              to'lgani sari narx tarixi shu yerda paydo bo'ladi.
            </p>
          </div>
        )}
      </section>

      <div className="mt-3 flex flex-col gap-2.5">
        <Link
          to="/my/listings/new"
          className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3.5 text-center text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35"
        >
          E'lon joylash
        </Link>
        <button
          type="button"
          onClick={handleUntrack}
          disabled={isDeleting}
          className="rounded-[14px] border border-line px-5 py-3.5 text-[14.5px] font-bold text-ink-2 transition-colors hover:bg-surface hover:text-brand-rose disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? 'To‘xtatilmoqda...' : "Kuzatuvni to'xtatish"}
        </button>
      </div>
    </main>
  );
}
