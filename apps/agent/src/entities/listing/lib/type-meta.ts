import type { ListingType } from '@rieltor/shared';

/**
 * How a listing type is presented in the cabinet — a LOCAL copy of the
 * marketplace's labels and badge colours. `apps/agent` must not import from
 * `apps/web`, so the four labels are duplicated here; they match the copy buyers
 * see in the marketplace exactly, so the two apps never read differently.
 */
export const LISTING_TYPE_META = {
  NEW_BUILD: { label: 'Yangi qurilish', badge: 'bg-brand-green/90' },
  SECONDARY: { label: 'Ikkilamchi', badge: 'bg-accent/90' },
  HOUSE: { label: 'Hovli', badge: 'bg-brand-amber/90' },
  COMMERCIAL: { label: 'Tijorat', badge: 'bg-brand-rose/90' },
} as const satisfies Record<ListingType, { label: string; badge: string }>;

/** The four types in declaration order — drives the browse page's type filter. */
export const LISTING_TYPES = Object.keys(LISTING_TYPE_META) as ListingType[];
