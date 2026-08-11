import { distanceKm, formatDistance, type ListingSummary, type Point } from '@rieltor/shared';

/**
 * A card's distance badge, or undefined when either end of the measurement is
 * missing. Lives in `entities` because it only depends on a listing and a point —
 * the user's location itself is a `features` concern and is passed in.
 */
export function distanceLabel(listing: ListingSummary, origin: Point | null): string | undefined {
  if (!origin || listing.lat === null || listing.lng === null) return undefined;
  return formatDistance(distanceKm(origin, { lat: listing.lat, lng: listing.lng }));
}
