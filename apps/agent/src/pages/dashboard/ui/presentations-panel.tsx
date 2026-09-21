import { Link } from 'react-router';
import type { PresentationSummary } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

/** How many presentations the activity panel surfaces. */
const TOP_LIMIT = 5;

/**
 * Presentations activity panel (MAIN) — the realtor's most-opened presentations,
 * a read-only preview capped at the top five by `opensCount`. The Taqdimotlar page
 * owns the full list; here each row links nowhere, just reporting engagement.
 */
export function PresentationsPanel({
  presentations,
  className,
}: {
  presentations: PresentationSummary[] | undefined;
  className?: string;
}) {
  const top = [...(presentations ?? [])]
    .sort((a, b) => b.opensCount - a.opensCount)
    .slice(0, TOP_LIMIT);

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Taqdimotlar faolligi</h2>
        <Link
          to="/presentations"
          className="shrink-0 text-[13px] font-bold text-accent hover:underline"
        >
          Barchasi
        </Link>
      </div>

      {top.length === 0 ? (
        <p className="mt-3 text-[14px] text-ink-3">Hozircha taqdimot yo'q</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-line">
          {top.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                {p.title}
              </span>
              <span className="shrink-0 text-[13px] font-semibold text-ink-3">
                {`${p.opensCount} ochilish`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
