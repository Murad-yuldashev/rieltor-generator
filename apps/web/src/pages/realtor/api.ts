import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { MyReviewSchema, PublicRealtorSchema, type RealtorInquiryCreate } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';
import { readTokens } from '@/shared/api/auth-storage';

/**
 * The public, slug-gated realtor microsite (GET /api/r/:slug). No auth — a
 * visitor with the link opens it directly. A 404 surfaces as an ApiError the
 * page maps to the "not found" view. Not subscription-gated: a lapsed
 * subscription still serves the page (the API decides that, not the client).
 */
export const realtorQuery = (slug: string) =>
  queryOptions({
    queryKey: ['realtor', slug] as const,
    queryFn: () => apiGet(`/api/r/${slug}`, PublicRealtorSchema),
    // A microsite is a slow-moving profile — no need to refetch on every focus.
    staleTime: 5 * 60 * 1000,
  });

/**
 * The signed-in viewer's own review of this realtor (any status), or null if
 * they have none — GET /api/r/:slug/my-review (JwtGuard). Gated on token
 * presence exactly like `useSession`: without a token there is nothing to ask
 * about, and firing the request would be a guaranteed 401.
 */
export const myReviewQuery = (slug: string) =>
  queryOptions({
    queryKey: ['realtor', slug, 'my-review'] as const,
    queryFn: () => apiGet(`/api/r/${slug}/my-review`, MyReviewSchema.nullable()),
    enabled: readTokens() !== null,
    staleTime: 60 * 1000,
  });

/**
 * Submits (or re-submits) the viewer's review — POST /api/r/:slug/reviews
 * (JwtGuard). On success both the public profile (aggregate + APPROVED list)
 * and the viewer's own-review query are invalidated so the UI reflects the new
 * PENDING state and any recomputed average.
 */
export function useSubmitReview(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { rating: number; comment?: string }) =>
      apiPost(`/api/r/${slug}/reviews`, MyReviewSchema, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['realtor', slug] });
      void queryClient.invalidateQueries({ queryKey: ['realtor', slug, 'my-review'] });
    },
  });
}

/** The public inquiry endpoint returns only `{ ok: true }` — no ids leak (Task 2). */
const InquiryResultSchema = z.object({ ok: z.literal(true) });

/**
 * Submits a site visitor's inquiry — POST /api/r/:slug/inquiry (public, no auth).
 * MVP scope is a single page-level GENERAL lead: `{ name, phone, message }` only,
 * with no `listingId` (there is no per-card CTA this phase — the reused ListingCard
 * would navigate away). The server canonicalizes the phone, mints a realtor-attributed
 * lead, and notifies the realtor; the client only asserts the `{ ok: true }` shape.
 */
export function submitInquiry(
  slug: string,
  body: Pick<RealtorInquiryCreate, 'name' | 'phone' | 'message'>,
): Promise<{ ok: true }> {
  return apiPost(`/api/r/${slug}/inquiry`, InquiryResultSchema, body);
}
