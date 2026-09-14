import { queryOptions } from '@tanstack/react-query';
import { ArticleDetailSchema, ArticleSummarySchema, type ArticleCategory } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/** The public journal feed (GET /api/jurnal). An optional category narrows it server-side. No auth. */
export const articlesQuery = (category?: ArticleCategory) =>
  queryOptions({
    queryKey: ['articles', category ?? 'all'] as const,
    queryFn: () =>
      apiGet(
        `/api/jurnal${category ? `?category=${category}` : ''}`,
        z.array(ArticleSummarySchema),
      ),
  });

/**
 * A single published article (GET /api/jurnal/:slug). A 404 surfaces as an ApiError
 * the page maps to its "not found" view. Articles are slow-moving SEO landing pages —
 * no need to refetch on every focus.
 */
export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ['article', slug] as const,
    queryFn: () => apiGet(`/api/jurnal/${slug}`, ArticleDetailSchema),
    staleTime: 5 * 60 * 1000,
  });
