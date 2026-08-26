import {
  IMAGE_SIZES,
  formatPriceSom,
  imageFallbackSrc,
  imageSrcSet,
  type ListingSummary,
} from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { LISTING_TYPE_META } from '../lib/type-meta';

interface Props {
  listing: ListingSummary;
  /** The first card in a list is the LCP candidate — its image loads eagerly. */
  isFirst?: boolean;
  /** Opens the private-note editor for this listing. */
  onNote?: () => void;
  /** True when a private note already exists — flips the "Eslatma" button's look. */
  hasNote?: boolean;
  /** Rendered under the body on the "Mening eslatmalarim" page (the note snippet). */
  noteSnippet?: string;
}

/**
 * A compact `ListingSummary` card for the cabinet — a simplified port of the
 * marketplace card (image, price, title, district, a coloured type badge). It is
 * NOT a link: the cabinet has no listing-detail route, so the card is a static
 * surface carrying two actions. The image `src` is built the same way the
 * marketplace builds it — `imageFallbackSrc(base)` for the JPG fallback and
 * `imageSrcSet(base)` for the responsive WebP set — from the `image.base` path
 * ("/images/…"), so both apps request identical files.
 */
export function ListingCard({
  listing,
  isFirst = false,
  onNote,
  hasNote = false,
  noteSnippet,
}: Props) {
  const meta = LISTING_TYPE_META[listing.type];

  return (
    <article className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <div className="relative aspect-[4/3] bg-line">
        {listing.image && (
          <img
            src={imageFallbackSrc(listing.image.base)}
            srcSet={imageSrcSet(listing.image.base)}
            sizes={IMAGE_SIZES}
            width={listing.image.width}
            height={listing.image.height}
            alt={listing.title}
            loading={isFirst ? 'eager' : 'lazy'}
            fetchPriority={isFirst ? 'high' : 'auto'}
            decoding={isFirst ? 'sync' : 'async'}
            className="h-full w-full object-cover"
          />
        )}

        <span
          className={cn(
            'absolute top-3 left-3 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide text-white uppercase backdrop-blur-sm',
            meta.badge,
          )}
        >
          {meta.label}
        </span>

        {listing.imageCount > 0 && (
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
            <Icon name="camera" className="h-3 w-3" strokeWidth={2.2} />
            {listing.imageCount}
          </div>
        )}
      </div>

      <div className="px-[15px] pt-3.5 pb-[15px]">
        <p className="text-xl font-extrabold tracking-tight text-accent-dark">
          {formatPriceSom(listing.priceSom, listing.deal)}
        </p>

        <h3 className="mt-1.5 text-[15px] leading-[1.35] font-semibold text-ink">
          {listing.title}
        </h3>

        <p className="mt-2.5 flex items-start gap-1.5 text-[13px] font-medium text-ink-2">
          <Icon name="pin" className="mt-px h-3.5 w-3.5 text-ink-3" strokeWidth={2.2} />
          <span>
            {listing.district} · {listing.landmark}
          </span>
        </p>

        {noteSnippet && (
          <p className="mt-3 line-clamp-3 rounded-[12px] bg-surface px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-ink-2">
            {noteSnippet}
          </p>
        )}

        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={onNote}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[12px] px-3 py-2.5 text-[13px] font-bold',
              hasNote ? 'bg-accent text-white' : 'bg-accent-soft text-accent-dark',
            )}
          >
            <Icon name="doc" className="size-4" strokeWidth={2.2} />
            {hasNote ? 'Eslatmani ochish' : 'Eslatma'}
          </button>

          {/* The collections action lands in Task 11 — a disabled "tez orada"
              stub here so the card's layout is final and the note action works. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Tez orada"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-surface px-3 py-2.5 text-[13px] font-bold text-ink-3"
          >
            <Icon name="heart" className="size-4" />
            Kolleksiyaga
          </button>
        </div>
      </div>
    </article>
  );
}
