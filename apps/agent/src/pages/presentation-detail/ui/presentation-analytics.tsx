import type { PresentationDetail } from '@rieltor/shared';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';
import { cn } from '@/shared/lib/cn';

/**
 * Sticky-aside analytics for one presentation: the total opens and listing count
 * as tiles, plus a per-listing opens breakdown (top 5, bar-scaled to the busiest
 * item) so the realtor sees which properties drew the most attention.
 */
export function PresentationAnalytics({
  presentation,
  className,
}: {
  presentation: PresentationDetail;
  className?: string;
}) {
  const { totalOpens, items } = presentation;
  const maxOpens = Math.max(0, ...items.map((i) => i.opens));
  const top = [...items].sort((a, b) => b.opens - a.opens).slice(0, 5);
  return (
    <section className={cn('rounded-card bg-card p-4 shadow-card', className)}>
      <h2 className="mb-3 text-[15px] font-bold text-ink">Tahlil</h2>
      <StatTileRow className="grid grid-cols-2 gap-3">
        <StatTile label="Jami ochilishlar" value={totalOpens} tone="green" />
        <StatTile label="E'lonlar soni" value={items.length} />
      </StatTileRow>
      {totalOpens > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          {top.map((item) => (
            <li key={item.listingId}>
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="min-w-0 truncate font-medium text-ink-2">
                  {item.listing.title}
                </span>
                <span className="shrink-0 font-bold text-ink">{item.opens}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${maxOpens > 0 ? Math.round((item.opens / maxOpens) * 100) : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
