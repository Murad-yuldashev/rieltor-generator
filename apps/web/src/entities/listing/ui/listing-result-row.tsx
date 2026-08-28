import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  formatPricePerM2,
  formatPriceSom,
  formatPriceUsd,
  type ListingSummary,
} from '@rieltor/shared';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';
import { relativeFreshness } from '../lib/relative-time';
import { TypeBadge } from './type-badge';

interface Props {
  listing: ListingSummary;
  /**
   * The heart button lives in `features` while the row is an `entity`, so it
   * cannot import it directly (FSD) — the search page injects it, same as
   * `ListingCard` does for the phone grid.
   */
  favoriteSlot?: ReactNode;
}

/**
 * CIAN-style three-column search-result row — desktop only (spec §2.2). The
 * phone list keeps `ListingCard`; this never renders below the `desk:` (1440px)
 * breakpoint, so it is safe to lay out with fixed column widths.
 */
export function ListingResultRow({ listing, favoriteSlot }: Props) {
  const href = `/obj/${listing.id}`;

  return (
    <article className="grid grid-cols-[19.375rem_1fr_14.375rem] gap-5 rounded-card border border-line/60 bg-card p-4 shadow-card">
      <Link to={href} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-line">
        {listing.image && (
          <ResponsiveImage image={listing.image} alt={listing.title} className="h-full w-full" />
        )}

        <div className="absolute top-3 left-3">
          <TypeBadge type={listing.type} />
        </div>

        {listing.imageCount > 0 && (
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
            <Icon name="camera" className="h-3 w-3" strokeWidth={2.2} />
            {listing.imageCount}
          </div>
        )}
      </Link>

      <div className="min-w-0">
        <Link to={href} className="text-xl font-bold text-accent-dark hover:underline">
          {listing.title}
        </Link>

        <p className="mt-1.5 text-[13.5px] font-semibold text-ink-3">
          {/* Commercial premises have no room count; houses have no floor — each drops out. */}
          {listing.rooms !== null && `${listing.rooms}-xona · `}
          {listing.areaM2} m²
          {listing.floor !== null && ` · ${listing.floor}-qavat`}
        </p>

        <p className="mt-2 flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2">
          <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={2.2} />
          <span className="truncate">
            {listing.district} · {listing.landmark}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-[28px] leading-none font-extrabold tracking-tight text-accent-dark">
            {formatPriceSom(listing.priceSom, listing.deal)}
          </span>
          <span className="text-[13.5px] font-bold text-ink-3">
            ≈ {formatPriceUsd(listing.priceUsd, listing.deal)}
          </span>
          {/* "mln/m²" only reads as a price per square metre for a sale — a
              monthly rent divided by the area rounds to nothing. */}
          {listing.deal === 'SALE' && (
            <span className="text-[13px] font-semibold text-ink-3">
              {formatPricePerM2(listing.priceSom, listing.areaM2)}
            </span>
          )}
        </div>

        <p className="mt-2.5 line-clamp-4 text-[13.5px] leading-[1.6] text-ink-2">
          {listing.descriptionShort}
        </p>

        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-3">
          <Icon name="calendar" className="h-[13px] w-[13px]" />
          {relativeFreshness(listing.listedAt)}
        </p>
      </div>

      <div className="relative h-fit rounded-card bg-surface p-4">
        {favoriteSlot && <div className="absolute top-3 right-3">{favoriteSlot}</div>}

        <p className="pr-9 text-[15px] leading-tight font-extrabold">{listing.agentName}</p>
        <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink-3">
          {listing.agencyName}
        </p>

        {/* Same ruling as the AgentCard seller panel: a seed listing (default
            Agent, agentProfileSlug null) keeps the legacy static badge exactly
            as before — this whole branch is byte-identical to the pre-3.3a row.
            A real published realtor (agentProfileSlug set) earns the badge only
            once a moderator has verified them. */}
        {listing.agentProfileSlug === null ? (
          <span className="mt-2 inline-block rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
            ✓ TEKSHIRILGAN
          </span>
        ) : (
          listing.agentVerified && (
            <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
              <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
              Tasdiqlangan
            </span>
          )
        )}

        {/* Display-only: reveal-on-tap is centralised on the listing detail
            page (a later task), not duplicated per row. */}
        <p className="mt-3 flex items-center gap-1.5 rounded-[10px] border border-line bg-card px-3 py-2 text-[13.5px] font-bold text-ink-2">
          <Icon name="phone" className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.2} />
          <span className="truncate">{listing.agentPhoneMasked}</span>
        </p>

        <Link
          to={href}
          className="mt-2.5 block rounded-[12px] bg-linear-to-br from-violet-600 to-accent-dark py-2.5 text-center text-[13.5px] font-extrabold text-white"
        >
          Batafsil
        </Link>
      </div>
    </article>
  );
}
