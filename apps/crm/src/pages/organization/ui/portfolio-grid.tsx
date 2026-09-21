import { Link } from 'react-router';
import type { Complex } from '@rieltor/shared';
import {
  COMPLEX_STATUS_BADGE,
  COMPLEX_STATUS_LABELS,
  PUBLISH_STATE_BADGE,
  PUBLISH_STATE_LABELS,
} from '@/features/developer';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

/** How many complexes the dashboard portfolio preview shows before "Barchasi". */
const PREVIEW_LIMIT = 5;

/**
 * Portfolio preview — the top few complexes as compact cards, each linking to its
 * detail, with the build-status and marketplace-publish badges. "Barchasi" jumps to
 * the full list. Purely a preview: the complexes page owns the complete grid.
 */
export function PortfolioGrid({
  complexes,
  className,
}: {
  complexes: Complex[];
  className?: string;
}) {
  const preview = complexes.slice(0, PREVIEW_LIMIT);

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Majmualar portfeli</h2>
        <Link
          to="/complexes"
          className="shrink-0 text-[13px] font-bold text-accent hover:underline"
        >
          Barchasi
        </Link>
      </div>

      {preview.length === 0 ? (
        <p className="mt-3 text-[14px] text-ink-3">Hozircha majmua yo'q</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {preview.map((complex) => (
            <Link
              key={complex.id}
              to={`/complexes/${complex.id}`}
              className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-3.5"
            >
              <span className="truncate text-[14px] font-bold text-ink">{complex.name}</span>
              <span className="flex items-center gap-1 text-[13px] text-ink-2">
                <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={2.2} />
                <span className="truncate">{complex.district}</span>
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
                    COMPLEX_STATUS_BADGE[complex.status],
                  )}
                >
                  {COMPLEX_STATUS_LABELS[complex.status]}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
                    PUBLISH_STATE_BADGE[complex.publishStatus],
                  )}
                >
                  {PUBLISH_STATE_LABELS[complex.publishStatus]}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
