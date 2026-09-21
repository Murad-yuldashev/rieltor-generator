import { formatPriceSom } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

/**
 * Collection-progress bar — how much of the contracted value has been collected.
 * Pure CSS (no chart library): a track with a blue-accent fill. The percentage is
 * computed in BigInt (contracted/collected may exceed a JS number), converting only
 * the bounded 0–10000 basis-point result to a number for the width.
 */
export function CollectionBar({
  collectedSom,
  contractedSom,
  className,
}: {
  collectedSom: string;
  contractedSom: string;
  className?: string;
}) {
  const contracted = BigInt(contractedSom);
  const collected = BigInt(collectedSom);
  // Basis points (0–10000) of collection, clamped so a data quirk can't overflow the bar.
  const bps = contracted > 0n ? Number((collected * 10_000n) / contracted) : 0;
  const percent = Math.min(100, Math.max(0, bps / 100));

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Yig'ilganlik</h2>
        <span className="text-[15px] font-extrabold text-accent">{percent.toFixed(0)}%</span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2.5 text-[13px] text-ink-2">
        <span className="font-bold text-ink">{formatPriceSom(collectedSom, 'SALE')}</span>
        {' / '}
        {formatPriceSom(contractedSom, 'SALE')}
      </p>
    </section>
  );
}
