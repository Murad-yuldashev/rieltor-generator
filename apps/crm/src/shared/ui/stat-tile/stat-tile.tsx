import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Tone of a tile's value; maps to a brand text color (default is neutral ink). */
export type StatTileTone = 'default' | 'green' | 'amber' | 'rose';

const TONE_CLASS: Record<StatTileTone, string> = {
  default: 'text-ink',
  green: 'text-brand-green',
  amber: 'text-brand-amber',
  rose: 'text-brand-rose',
};

/**
 * One summary tile — a label, a big value, an optional colored `badge` pill and an
 * optional `sub` subline. Purely presentational; callers supply the formatted strings.
 * `tone` paints the value (`green`/`amber`/`rose`); it defaults to neutral ink.
 */
export function StatTile({
  label,
  value,
  tone = 'default',
  badge,
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: StatTileTone;
  badge?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <p className="text-[12px] font-semibold text-ink-2">{label}</p>
      <p className={cn('mt-1.5 text-[18px] font-extrabold leading-tight', TONE_CLASS[tone])}>
        {value}
      </p>
      {badge && (
        <span className="mt-2 inline-flex rounded-full bg-brand-rose/10 px-2.5 py-1 text-[12px] font-bold text-brand-rose">
          {badge}
        </span>
      )}
      {sub && <p className="mt-1 text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

/** Grid wrapper for a row of `StatTile`s. `className` overrides the default columns. */
export function StatTileRow({
  children,
  className = 'grid grid-cols-2 gap-3',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
