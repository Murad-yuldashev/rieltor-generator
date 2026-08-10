import { useState } from 'react';
import type { Deal, ListingSummary, Point } from '@rieltor/shared';
import {
  EMPTY_CRITERIA,
  filterListings,
  type Criteria,
  type Sort,
  type TypeFilter,
} from './criteria';

/**
 * Filter state for the home list: deal segment, type chips, sort and the search box.
 *
 * Price / area / room-count live only in the search page's filter panel, so they
 * stay at their defaults here — the home page has no controls for them.
 */
export function useListingFilters(
  listings: ListingSummary[] | undefined,
  origin: Point | null = null,
) {
  const [deal, setDeal] = useState<Deal>(EMPTY_CRITERIA.deal);
  const [type, setType] = useState<TypeFilter>(EMPTY_CRITERIA.type);
  const [sort, setSort] = useState<Sort>(EMPTY_CRITERIA.sort);
  const [search, setSearch] = useState(EMPTY_CRITERIA.search);

  const criteria: Criteria = { ...EMPTY_CRITERIA, deal, type, sort, search };

  return {
    deal,
    setDeal,
    type,
    setType,
    sort,
    setSort,
    search,
    setSearch,
    // Only a couple of dozen listings — memoising would not earn its keep.
    visible: filterListings(listings, criteria, origin),
  };
}
