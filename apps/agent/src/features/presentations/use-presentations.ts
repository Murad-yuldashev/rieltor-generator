import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PresentationCreateResultSchema,
  PresentationDetailSchema,
  PresentationSummarySchema,
} from '@rieltor/shared';
import * as z from 'zod';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';

/** The presentations-list key, shared by the list query, create-and-share (T7),
 *  and delete so any of them can invalidate the list. */
export const PRESENTATIONS_QUERY_KEY = ['presentations'] as const;

/** Per-presentation detail (analytics) cache key. */
export const presentationQueryKey = (id: string) => ['presentation', id] as const;

const PresentationSummaryArraySchema = z.array(PresentationSummarySchema);

/** The collection-detail cache key, kept in sync with the collections feature's
 *  `collectionQueryKey`. Inlined (not imported) because FSD boundaries forbid one
 *  feature depending on another. */
const collectionQueryKey = (collectionId: string) => ['collection', collectionId] as const;

/**
 * `PATCH /api/agent/collections/:collectionId/items/:listingId` ({ note }) — sets
 * (or clears, with `null`) the CLIENT-FACING note shown on the presentation for one
 * item. This is distinct from the private note (`/api/agent/notes`); the client
 * sees this one. The endpoint returns no body, so on success we invalidate the
 * collection detail (`['collection', collectionId]`) to pull the new note back.
 */
export function useSetItemNote(collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, note }: { listingId: string; note: string | null }) =>
      apiPatch(`/api/agent/collections/${collectionId}/items/${listingId}`, undefined, { note }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionQueryKey(collectionId) });
    },
  });
}

/**
 * `POST /api/agent/collections/:collectionId/present` → a fresh PresentationCreateResult
 * ({ id, token, url }). Snapshots the collection's current items + notes into an
 * immutable, publicly shareable presentation. 400 "Kolleksiya bo'sh" when the
 * collection is empty. Invalidates `['presentations']` so the Task 8 list refreshes.
 */
export function useCreatePresentation(collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiPost(`/api/agent/collections/${collectionId}/present`, PresentationCreateResultSchema),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    },
  });
}

/**
 * `GET /api/agent/presentations` (RealtorGuard) → this realtor's presentations,
 * newest first, each with its public URL and open count. Powers the "Mening
 * taqdimotlarim" list and the dashboard count.
 */
export function usePresentations() {
  return useQuery({
    queryKey: PRESENTATIONS_QUERY_KEY,
    queryFn: () => apiGet('/api/agent/presentations', PresentationSummaryArraySchema),
    staleTime: 30 * 1000,
  });
}

/**
 * `GET /api/agent/presentations/:id` → one presentation with its per-listing
 * analytics (opens + average dwell), items ordered by position asc. `enabled`
 * lets a caller skip the fetch until an id is in hand.
 */
export function usePresentation(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: presentationQueryKey(id),
    queryFn: () => apiGet(`/api/agent/presentations/${id}`, PresentationDetailSchema),
    enabled: enabled && id !== '',
  });
}

/**
 * `DELETE /api/agent/presentations/:id`. Drops the detail cache entry and refreshes
 * the list so the removed presentation disappears.
 */
export function useDeletePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/agent/presentations/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: presentationQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    },
  });
}

/**
 * Builds a Telegram "share" deep link that pre-fills the given public URL and a
 * caption (the collection name). Opening it lets the realtor forward the
 * presentation to a client in a couple of taps.
 */
export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
