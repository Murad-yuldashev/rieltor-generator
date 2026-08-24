import type { Deal } from '@rieltor/shared';
import type { Criteria, TypeFilter } from './criteria';

/**
 * The slice of `Criteria` a saved search remembers: deal segment, type chip and
 * the free-text search box — the same fields `FilterBar` (home page) exposes.
 * Price/area/room filters live only in the search page's panel and are not
 * part of what "Qidiruvni saqlash" captures.
 */
export interface SearchQuery {
  deal: Deal;
  type: TypeFilter;
  search: string;
}

/** Builds the query string a SavedSearch row stores (no leading "?"). */
export function serializeSearchQuery({ deal, type, search }: SearchQuery): string {
  const params = new URLSearchParams();
  params.set('deal', deal);
  if (type !== 'ALL') params.set('type', type);
  if (search.trim()) params.set('search', search.trim());
  return params.toString();
}

/** The inverse of `serializeSearchQuery` — used by the search page to restore a saved search. */
export function parseSearchQuery(query: string): Partial<Criteria> {
  const params = new URLSearchParams(query);
  const criteria: Partial<Criteria> = {};

  const deal = params.get('deal');
  if (deal === 'SALE' || deal === 'RENT') criteria.deal = deal;

  const type = params.get('type');
  if (type) criteria.type = type as TypeFilter;

  const search = params.get('search');
  if (search) criteria.search = search;

  return criteria;
}
