import { Link } from 'react-router';
import { formatPriceSom, type OwnerListingSummary } from '@rieltor/shared';
import { LISTING_TYPE_META, PUBLIC_DETAIL_STATUSES } from '@/entities/listing';
import { STATUS_META } from '@/features/listing-form';
import { ShareButton } from '@/features/listing-share';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  listing: OwnerListingSummary;
}

/**
 * A condensed card for the realtor's own listing list — same footprint as
 * entities/listing's ListingRow (favourites), but linking to the edit page instead
 * of the public one (a DRAFT/PENDING/ARCHIVED listing 404s on /obj/:id for everyone,
 * owner included — see ListingsService.findOne's PUBLIC_DETAIL_STATUSES) and carrying
 * the owner-only status badge, plus a compact "Statistika"/"Ulashish" action row
 * (design spec §8.1/§8.3).
 */
export function MyListingRow({ listing }: Props) {
  const meta = STATUS_META[listing.status];

  return (
    <div className="rounded-card border border-line/60 bg-card p-2.5 shadow-card">
      <Link to={`/cabinet/obj/${listing.id}/edit`} className="flex items-center gap-3">
        <div className="relative h-[72px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-line">
          {listing.image && (
            <ResponsiveImage image={listing.image} alt="" className="h-full w-full" />
          )}
          {/* A scaled-down badge, not <TypeBadge> — that component's padding and text
              size are fixed, and cn() (plain clsx) cannot reliably override Tailwind
              utility conflicts. Same approach as entities/listing's ListingRow. */}
          <span
            className={cn(
              'absolute top-1 left-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-white uppercase backdrop-blur-sm',
              LISTING_TYPE_META[listing.type].badge,
            )}
          >
            {LISTING_TYPE_META[listing.type].label}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9.5px] font-extrabold text-white',
              meta.badge,
            )}
          >
            {meta.label}
          </span>
          <p className="mt-1 text-[14.5px] leading-tight font-extrabold text-accent-dark">
            {/* A brand-new DRAFT starts at priceSom "0" (listings-write.service.ts's
                DRAFT_DEFAULTS) — shown as a prompt rather than a literal "0 so'm". */}
            {listing.priceSom === '0'
              ? 'Narx kiritilmagan'
              : formatPriceSom(listing.priceSom, listing.deal)}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-ink">
            {listing.title || "Sarlavhasiz e'lon"}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-ink-3">
            {listing.rooms !== null && `${listing.rooms} xona · `}
            {listing.areaM2} m² ·{' '}
            {listing.district.replace(/\s*tumani$/, '') || 'Tuman kiritilmagan'}
          </p>
        </div>

        <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={2.4} />
      </Link>

      <div className="mt-2 flex gap-2 border-t border-line/60 pt-2">
        <Link
          to={`/cabinet/obj/${listing.id}/stats`}
          className="flex flex-1 items-center justify-center gap-1 rounded-[10px] bg-surface py-1.5 text-[12px] font-bold text-ink-2"
        >
          <Icon name="eye" className="h-3.5 w-3.5" strokeWidth={2.2} />
          Statistika
        </Link>
        {/* A DRAFT/PENDING/ARCHIVED listing 404s for everyone but its owner — sharing
            its link would be pointless. */}
        {PUBLIC_DETAIL_STATUSES.has(listing.status) && (
          <ShareButton
            listingId={listing.id}
            listing={listing}
            className="flex flex-1 items-center justify-center gap-1 rounded-[10px] bg-accent/10 py-1.5 text-[12px] font-bold text-accent"
          >
            <Icon name="share" className="h-3.5 w-3.5" strokeWidth={2.2} />
            Ulashish
          </ShareButton>
        )}
      </div>
    </div>
  );
}
