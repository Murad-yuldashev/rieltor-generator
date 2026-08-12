import type { ListingStatus } from '@rieltor/shared';

interface Props {
  /** SOLD reads "sotilgan", everything else (in practice only RENTED)
   *  reads "ijaraga berilgan" — @rieltor/shared's SoldListingSchema carries
   *  the full ListingStatus union, not a narrower SOLD | RENTED one. */
  status: ListingStatus;
  /** Days between publishedAt and soldAt (RealtorShowcaseSchema's soldInDays). */
  days: number;
}

/**
 * "N kunda sotilgan" / "N kunda ijaraga berilgan" — overlaid on a <ListingCard>
 * in the showcase's "Sotilgan obyektlar" section (design spec §9.1). A standalone
 * pill rather than a <ListingCard> prop: entities cannot depend on a sibling
 * entity under this project's FSD boundaries, so the composition with
 * entities/listing's card happens one layer up, in pages/realtor-showcase.
 */
export function SoldBadge({ status, days }: Props) {
  const label = status === 'RENTED' ? 'ijaraga berilgan' : 'sotilgan';

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-green/90 px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide text-white backdrop-blur-sm">
      {days} kunda {label}
    </span>
  );
}
