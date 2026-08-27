import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PresentationCreateResultSchema } from '@rieltor/shared';
import { apiPatch, apiPost } from '@/shared/api/client';

/** The presentations-list key. The list itself lands in Task 8; owning the key
 *  here lets create-and-share invalidate it so the new presentation shows up. */
export const PRESENTATIONS_QUERY_KEY = ['presentations'] as const;

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
 * Builds a Telegram "share" deep link that pre-fills the given public URL and a
 * caption (the collection name). Opening it lets the realtor forward the
 * presentation to a client in a couple of taps.
 */
export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
