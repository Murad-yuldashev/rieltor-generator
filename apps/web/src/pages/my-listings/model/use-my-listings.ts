import { useQuery } from '@tanstack/react-query';
import { DealSchema } from '@rieltor/shared';
import * as z from 'zod';
import { useSession } from '@/entities/session';
import { apiGet } from '@/shared/api/client';

/**
 * `GET /api/my/listings` (Task 6's `ListingsService.listMine`) — no shared
 * schema exists for it yet, so it's defined here, next to its only consumer.
 */
const MyListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['DRAFT', 'MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED']),
  rejectionReason: z.string().nullable(),
  priceSom: z.string(),
  deal: DealSchema,
});

export type MyListing = z.infer<typeof MyListingSchema>;
export type MyListingStatus = MyListing['status'];

export function useMyListings() {
  const { isAuthenticated } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => apiGet('/api/my/listings', z.array(MyListingSchema)),
    enabled: isAuthenticated,
  });

  return { listings: data ?? [], isPending: isAuthenticated && isPending };
}
