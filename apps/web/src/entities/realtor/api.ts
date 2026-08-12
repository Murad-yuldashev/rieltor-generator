import { queryOptions } from '@tanstack/react-query';
import { RealtorShowcaseSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

export const realtorShowcaseQuery = (username: string) =>
  queryOptions({
    queryKey: ['realtorShowcase', username] as const,
    queryFn: () => apiGet(`/api/realtors/${username}`, RealtorShowcaseSchema),
  });
