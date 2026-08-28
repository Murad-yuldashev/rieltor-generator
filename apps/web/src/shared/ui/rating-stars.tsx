import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

const STARS = [1, 2, 3, 4, 5] as const;

interface RatingStarsProps {
  /** The rating to display; rounded to the nearest whole star. */
  value: number;
  className?: string;
}

/**
 * Read-only 5-star display. Full stars only (YAGNI — no half stars): a star is
 * filled when its 1-based index is at or below the rounded value. Filled stars
 * use the amber brand colour, empty ones the muted line colour.
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

interface StarPickerProps {
  /** The currently selected rating (1..5), or 0 for none yet. */
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * Interactive 5-star picker. Each star is a real `<button>` so it is keyboard-
 * focusable and screen-reader labelled; clicking one sets the rating to its value.
 */
export function StarPicker({ value, onChange, className }: StarPickerProps) {
  return (
    <div className={cn('inline-flex items-center gap-1', className)} role="group">
      {STARS.map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} yulduz`}
            aria-pressed={star === value}
            className="rounded-full p-0.5 transition-transform hover:scale-110"
          >
            <Icon
              name={filled ? 'starSolid' : 'star'}
              className={cn('h-7 w-7', filled ? 'text-brand-amber' : 'text-ink-3')}
            />
          </button>
        );
      })}
    </div>
  );
}
