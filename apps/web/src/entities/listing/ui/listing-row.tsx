import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatPriceSom, type ListingSummary } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';
import { ResponsiveImage } from '@/shared/ui/responsive-image';
import { LISTING_TYPE_META } from '../lib/type-meta';

interface Props {
  listing: ListingSummary;
  /** The heart lives in `features` while the card is an `entity` — hence the slot. */
  favoriteSlot?: ReactNode;
}

/** Compact horizontal card used by the favourites list (a condensed full card). */
export function ListingRow({ listing, favoriteSlot }: Props) {
  return (
    <article className="rounded-card border border-line/60 bg-card p-2.5 shadow-card">
      <div className="flex gap-3">
        <Link
          to={`/obj/${listing.id}`}
          className="relative h-[86px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-line"
        >
          {listing.image && (
            <ResponsiveImage image={listing.image} alt={listing.title} className="h-full w-full" />
          )}
          {/* Scaled-down version of the full card's badge — colour from the single source. */}
          <span
            className={cn(
              'absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-white uppercase backdrop-blur-sm',
              LISTING_TYPE_META[listing.type].badge,
            )}
          >
            {LISTING_TYPE_META[listing.type].label}
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-start gap-2">
            <Link to={`/obj/${listing.id}`} className="min-w-0 flex-1">
              <p className="text-[15px] leading-tight font-extrabold text-accent-dark">
                {formatPriceSom(listing.priceSom, listing.deal)}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug font-semibold">
                {listing.title}
              </p>
            </Link>
            {favoriteSlot}
          </div>
          <p className="mt-1.5 truncate text-xs font-semibold text-ink-3">
            {/* Commercial premises have no room count — that part drops out. */}
            {listing.rooms !== null && `${listing.rooms} xona · `}
            {listing.areaM2} m² · {listing.district.replace(/\s*tumani$/, '')}
          </p>
        </div>
      </div>
    </article>
  );
}
