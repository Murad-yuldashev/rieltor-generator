import { useQuery } from '@tanstack/react-query';
import { ListingSummarySchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

const ListingSummaryArraySchema = z.array(ListingSummarySchema);

export const LISTINGS_QUERY_KEY = ['objects'] as const;

/**
 * `GET /api/objects` → every published listing (public, no auth). The cabinet
 * browses the same catalogue buyers see; all filtering happens client-side, so
 * the payload is fetched once and cached for the session.
 */
export function useListings() {
  return useQuery({
    queryKey: LISTINGS_QUERY_KEY,
    queryFn: () => apiGet('/api/objects', ListingSummaryArraySchema),
    staleTime: 5 * 60 * 1000,
  });
}
