import * as z from 'zod';
import { formatPriceSom } from './format';
import type { ListingSummary } from './schemas';

/** POST /api/objects/:id/share body — an optional realtor-chosen name for the channel. */
export const ShareCreateSchema = z.object({
  label: z.string().max(60).optional(),
});

/** What POST /api/objects/:id/share returns. */
export const ShareLinkSchema = z.object({
  code: z.string(),
  url: z.string(),
});

export type ShareCreate = z.infer<typeof ShareCreateSchema>;
export type ShareLink = z.infer<typeof ShareLinkSchema>;

/** The listing fields buildShareCaption needs, plus the share link to append. */
export type ShareCaptionListing = Pick<
  ListingSummary,
  'title' | 'priceSom' | 'deal' | 'rooms' | 'areaM2' | 'district'
> & {
  url: string;
};

/**
 * "sarlavha · narx · xona/m² · tuman · havola" (design spec §8.1) — the caption a
 * realtor pastes alongside their share link. Reuses formatPriceSom so a RENT price
 * carries its "/oy" suffix exactly like everywhere else in the app.
 */
export function buildShareCaption(listing: ShareCaptionListing): string {
  const price = formatPriceSom(listing.priceSom, listing.deal);
  const roomsArea =
    listing.rooms !== null ? `${listing.rooms} xona, ${listing.areaM2} m²` : `${listing.areaM2} m²`;

  return [listing.title, price, roomsArea, listing.district, listing.url].join(' · ');
}
