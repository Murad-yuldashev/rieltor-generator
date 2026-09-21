import { Link } from 'react-router';
import { IMAGE_SIZES, imageFallbackSrc, imageSrcSet, type Complex } from '@rieltor/shared';
import {
  COMPLEX_STATUS_BADGE,
  COMPLEX_STATUS_LABELS,
  PUBLISH_STATE_BADGE,
  PUBLISH_STATE_LABELS,
} from '@/features/developer';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

/**
 * One complex in the list grid — a cover-image card linking to its detail page.
 * Mirrors the web marketplace card idiom (aspect-[4/3] cover + build-status overlay
 * + name + district) and adds the CRM-only meta the developer needs at a glance:
 * the marketplace publish state, the image count (red when the complex has no cover
 * image yet — an actionable nudge) and the default commission rate when one is set.
 */
export function ComplexCard({ complex }: { complex: Complex }) {
  // commissionBps is basis points (250 → 2.5%); null means no default rate set.
  const commissionPercent = complex.commissionBps != null ? complex.commissionBps / 100 : null;

  return (
    <Link
      to={`/complexes/${complex.id}`}
      className="flex flex-col overflow-hidden rounded-card border border-line/60 bg-card shadow-card"
    >
      <div className="relative aspect-[4/3] bg-line">
        {complex.coverImage && (
          <img
            src={imageFallbackSrc(complex.coverImage.base)}
            srcSet={imageSrcSet(complex.coverImage.base)}
            sizes={IMAGE_SIZES}
            width={complex.coverImage.width}
            height={complex.coverImage.height}
            alt={complex.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}

        <span
          className={cn(
            'absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11.5px] font-bold shadow-sm backdrop-blur-sm',
            COMPLEX_STATUS_BADGE[complex.status],
          )}
        >
          {COMPLEX_STATUS_LABELS[complex.status]}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <span className="truncate text-[15px] font-bold text-ink">{complex.name}</span>

        <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
          <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={2.2} />
          <span className="truncate">{complex.district}</span>
        </span>

        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
              PUBLISH_STATE_BADGE[complex.publishStatus],
            )}
          >
            {PUBLISH_STATE_LABELS[complex.publishStatus]}
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
              complex.imageCount === 0
                ? 'bg-brand-rose/10 text-brand-rose'
                : 'bg-surface text-ink-2',
            )}
          >
            {complex.imageCount} rasm
          </span>
          {commissionPercent != null && (
            <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-bold text-ink-2">
              Komissiya {commissionPercent}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
