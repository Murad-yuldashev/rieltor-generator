import type { ListingStatus } from '@rieltor/shared';

/**
 * Mirrors PUBLIC_DETAIL_STATUSES in apps/api/src/listings/listings.service.ts (design
 * spec §5.3) — the statuses whose /obj/:id page a visitor can actually reach. Cabinet
 * UI uses this to decide whether "Ulashish" (creating a ShareLink to that page) makes
 * sense; a DRAFT/PENDING/ARCHIVED listing 404s for everyone but its owner.
 */
export const PUBLIC_DETAIL_STATUSES: ReadonlySet<ListingStatus> = new Set([
  'ACTIVE',
  'RESERVED',
  'SOLD',
  'RENTED',
]);
