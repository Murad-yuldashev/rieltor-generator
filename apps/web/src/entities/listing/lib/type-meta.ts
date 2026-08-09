import type { ListingType } from '@rieltor/shared';

/**
 * How a listing type is presented — the SINGLE source.
 * The badge (the coloured tag over cards and the gallery) and the filter chip
 * both read from here, so the two can never drift apart.
 */
export const LISTING_TYPE_META = {
  NEW_BUILD: { label: 'Yangi qurilish', chipLabel: '🏗 Yangi qurilish', badge: 'bg-brand-green/90' },
  SECONDARY: { label: 'Ikkilamchi', chipLabel: '🏢 Ikkilamchi', badge: 'bg-accent/90' },
  HOUSE: { label: 'Hovli', chipLabel: '🏡 Hovli', badge: 'bg-brand-amber/90' },
  COMMERCIAL: { label: 'Tijorat', chipLabel: '🏪 Tijorat', badge: 'bg-brand-rose/90' },
} as const satisfies Record<ListingType, { label: string; chipLabel: string; badge: string }>;

export const LISTING_TYPES = Object.keys(LISTING_TYPE_META) as ListingType[];
