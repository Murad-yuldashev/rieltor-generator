import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { formatPriceSom, type TrackedProperty } from '@rieltor/shared';
import { LISTING_TYPE_META } from '@/entities/listing';
import { cn } from '@/shared/lib/cn';

// Lazy so Recharts lands in its own price-chart chunk instead of the initial
// bundle. Same module path as the detail chart → the two share one chunk.
const Sparkline = lazy(() =>
  import('@/shared/ui/price-chart/price-chart').then((m) => ({ default: m.Sparkline })),
);

/** Monthly delta pill — ▲ green when the estimate rose, ▼ rose when it fell. */
function DeltaChip({ deltaPct }: { deltaPct: number }) {
  const up = deltaPct >= 0;
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold',
        up ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-rose/10 text-brand-rose',
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(1)}%
    </span>
  );
}

/**
 * A tracked-property card for the `/my/properties` cabinet: title, current
 * estimate, monthly delta pill and a compact sparkline. The whole card links to
 * the detail page. The delta pill is hidden when the market has no comparables
 * (`estimateSom === '0'`) — a percentage off a zero baseline is meaningless.
 */
export function PropertyCard({ property }: { property: TrackedProperty }) {
  const { id, label, type, district, rooms, areaM2, estimateSom, deltaPct, sparkline } = property;
  const hasEstimate = estimateSom !== '0';
  const title = label ?? LISTING_TYPE_META[type].label;

  return (
    <Link
      to={`/my/properties/${id}`}
      className="flex flex-col gap-2.5 rounded-card border border-line/60 bg-card p-3.5 shadow-card transition-colors hover:border-accent/40 desk:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold text-ink">{title}</p>
          <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink-3">
            {LISTING_TYPE_META[type].label}
            {rooms !== null && ` · ${rooms} xona`} · {areaM2} m² ·{' '}
            {district.replace(/\s*tumani$/, '')}
          </p>
        </div>
        {hasEstimate && <DeltaChip deltaPct={deltaPct} />}
      </div>

      <p className="text-[17px] leading-tight font-extrabold text-accent-dark">
        {hasEstimate ? formatPriceSom(estimateSom, 'SALE') : 'Ma’lumot yetarli emas'}
      </p>

      {hasEstimate && sparkline.length > 1 && (
        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-surface" />}>
          <Sparkline points={sparkline} />
        </Suspense>
      )}
    </Link>
  );
}
