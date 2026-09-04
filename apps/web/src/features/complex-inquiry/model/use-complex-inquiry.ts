import { useMutation } from '@tanstack/react-query';
import {
  PropertyRequestSummarySchema,
  type ComplexInquiry,
  type PropertyRequestSummary,
} from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/**
 * A buyer's interest in a published ЖК. `POST /api/jk/:slug/inquiry` is
 * JwtGuard-protected (401 when signed out, 404 when the slug is not published)
 * and returns the minted lead as a `PropertyRequestSummary` — the same shape the
 * realtor pool serves — which we validate so a malformed response never reaches
 * the UI.
 */
export function useComplexInquiry(slug: string) {
  return useMutation<PropertyRequestSummary, Error, ComplexInquiry>({
    mutationFn: (body) => apiPost(`/api/jk/${slug}/inquiry`, PropertyRequestSummarySchema, body),
  });
}
