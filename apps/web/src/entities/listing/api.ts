import { queryOptions } from '@tanstack/react-query';
import { ListingDetailSchema, ListingSummarySchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

export const listingsQuery = () =>
  queryOptions({
    queryKey: ['listings'] as const,
    queryFn: () => apiGet('/api/objects', z.array(ListingSummarySchema)),
  });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ['listing', id] as const,
    queryFn: () => apiGet(`/api/objects/${id}`, ListingDetailSchema),
    // Obyekt ma'lumoti demo davomida o'zgarmaydi.
    staleTime: 5 * 60 * 1000,
  });
