import { queryOptions } from '@tanstack/react-query';
import { PublicComplexDetailSchema, PublicComplexSummarySchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/** The public marketplace list of published complexes (GET /api/jk). No auth. */
export const complexesQuery = () =>
  queryOptions({
    queryKey: ['complexes'] as const,
    queryFn: () => apiGet('/api/jk', z.array(PublicComplexSummarySchema)),
  });

/**
 * The full public complex page (GET /api/jk/:slug). A 404 surfaces as an
 * ApiError the page maps to its "not found" view. A published complex is a
 * slow-moving profile — no need to refetch on every focus.
 */
export const complexQuery = (slug: string) =>
  queryOptions({
    queryKey: ['complex', slug] as const,
    queryFn: () => apiGet(`/api/jk/${slug}`, PublicComplexDetailSchema),
    staleTime: 5 * 60 * 1000,
  });
