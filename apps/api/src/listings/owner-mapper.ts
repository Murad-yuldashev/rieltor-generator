import type { OwnerListingDetail, OwnerListingSummary } from '@rieltor/shared';
import { toListingDetail, toListingSummary, type ListingRow } from './mapper';

// ListingRow's Listing already carries `status` (added in Task 1), so the owner
// mappers are just the public mappers with that one extra field.
export function toOwnerListingSummary(row: ListingRow): OwnerListingSummary {
  return { ...toListingSummary(row), status: row.status };
}

export function toOwnerListingDetail(row: ListingRow): OwnerListingDetail {
  return { ...toListingDetail(row), status: row.status };
}
