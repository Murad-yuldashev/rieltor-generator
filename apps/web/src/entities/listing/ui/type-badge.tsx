import type { ListingType } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';
import { LISTING_TYPE_META } from '../lib/type-meta';

/** Coloured badge over a photo. The background is translucent so the image shows through. */
export function TypeBadge({ type, className }: { type: ListingType; className?: string }) {
  const { label, badge } = LISTING_TYPE_META[type];

  return (
    <span
      className={cn(
        'rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide text-white uppercase backdrop-blur-sm',
        badge,
        className,
      )}
    >
      {label}
    </span>
  );
}
