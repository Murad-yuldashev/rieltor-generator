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
import { StaticMap } from '@/shared/ui/static-map';
import { PriceDroppedBadge } from './price-dropped-badge';
import { TypeBadge } from './type-badge';

interface Props {
  listing: ListingSummary;
  /** The first card in a list is the LCP candidate — its image loads eagerly (spec §7). */
  isFirst?: boolean;
  /**
   * The heart button is injected from outside: favourites live in the `features`
   * layer while the card is an `entity`, so it cannot import them directly (FSD).
   */
  favoriteSlot?: ReactNode;
  /** Pre-formatted, e.g. "2.4 km" — the card never computes it (FSD: entities have no user location). */
  distanceLabel?: string;
  mapOpen?: boolean;
  /** Absent when the page does not offer maps at all. */
  onToggleMap?: () => void;
}

function Param({ icon, text }: { icon: 'rooms' | 'area' | 'floor'; text: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-[9px] bg-surface px-2.5 py-1.5 text-[12.5px] font-bold text-ink-2">
      <Icon name={icon} className="h-[13px] w-[13px] text-accent" strokeWidth={2.2} />
      {text}
    </span>
  );
}

export function ListingCard({
  listing,
  isFirst = false,
  favoriteSlot,
  distanceLabel,
  mapOpen,
  onToggleMap,
}: Props) {
  return (
    <article className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <Link to={`/obj/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] bg-line">
          {listing.image && (
            <ResponsiveImage
              image={listing.image}
              alt={listing.title}
              isFirst={isFirst}
              className="h-full w-full"
            />
          )}

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <TypeBadge type={listing.type} />
            {listing.priceDropped && <PriceDroppedBadge />}
          </div>

          {favoriteSlot && <div className="absolute top-2.5 right-2.5">{favoriteSlot}</div>}

          {listing.imageCount > 0 && (
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
              <Icon name="camera" className="h-3 w-3" strokeWidth={2.2} />
              {listing.imageCount}
            </div>
          )}

          {distanceLabel && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
              <Icon name="pin" className="h-3 w-3" strokeWidth={2.2} />
              {distanceLabel}
            </div>
          )}
        </div>

        <div className="px-[15px] pt-3.5 pb-[15px]">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight text-accent-dark">
              {formatPriceSom(listing.priceSom, listing.deal)}
            </span>
            <span className="text-[13px] font-bold text-ink-3">
              ≈ {formatPriceUsd(listing.priceUsd, listing.deal)}
            </span>
            {/* "mln/m²" only reads as a price per square metre for a sale — a
                monthly rent divided by the area rounds to nothing. */}
            {listing.deal === 'SALE' && (
              <span className="ml-auto text-xs font-semibold text-ink-3">
                {formatPricePerM2(listing.priceSom, listing.areaM2)}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 text-[15px] leading-[1.35] font-semibold">{listing.title}</h3>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {/* Commercial premises have no room count — the chip drops out. */}
            {listing.rooms !== null && <Param icon="rooms" text={`${listing.rooms} xona`} />}
            <Param icon="area" text={`${listing.areaM2} m²`} />
            {/* Houses have no floor — the chip drops out entirely. */}
            {listing.floor !== null && <Param icon="floor" text={`${listing.floor}-qavat`} />}
          </div>

          <p className="mt-2.5 flex items-start gap-1.5 text-[13px] font-medium text-ink-2">
            <Icon name="pin" className="mt-px h-3.5 w-3.5 text-ink-3" strokeWidth={2.2} />
            <span>
              {listing.district} · {listing.landmark}
            </span>
          </p>
        </div>
      </Link>

      {onToggleMap && listing.lat !== null && listing.lng !== null && (
        <div className="border-t border-line/60 px-4 py-2.5">
          <button
            type="button"
            onClick={onToggleMap}
            aria-expanded={mapOpen}
            className="flex items-center gap-1.5 text-[13px] font-bold text-accent"
          >
            <Icon name="pin" className="h-3.5 w-3.5" strokeWidth={2.4} />
            Joylashuvni ko'rsatish
          </button>

          {mapOpen && (
            <StaticMap
              point={{ lat: listing.lat, lng: listing.lng }}
              label={`${listing.title} joylashuvi`}
              className="mt-2.5 block"
            />
          )}
        </div>
      )}
    </article>
  );
}
