import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

const STARS = [1, 2, 3, 4, 5] as const;

interface RatingStarsProps {
  /** The rating to display; rounded to the nearest whole star. */
  value: number;
  className?: string;
}

/**
 * Read-only 5-star display, local to the cabinet SPA (apps/agent has its own
 * `Icon` — importing apps/web's RatingStars would be a forbidden cross-app import).
 * Full stars only (no half stars): a star is filled when its 1-based index is at or
 * below the rounded value. Filled stars use the amber brand colour, empty ones the
 * muted line colour.
 */
export function RatingStars({ value, className }: RatingStarsProps) {
  const rounded = Math.round(value);

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden="true">
      {STARS.map((star) => {
        const filled = star <= rounded;
        return (
          <Icon
            key={star}
            name={filled ? 'starSolid' : 'star'}
            className={cn('h-4 w-4', filled ? 'text-brand-amber' : 'text-ink-3')}
          />
        );
      })}
    </span>
  );
}
