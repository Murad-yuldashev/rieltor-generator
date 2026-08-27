import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionDetailSchema,
  CollectionSummarySchema,
  type CollectionDetail,
} from '@rieltor/shared';
import * as z from 'zod';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';

const CollectionSummaryArraySchema = z.array(CollectionSummarySchema);

export const COLLECTIONS_QUERY_KEY = ['collections'] as const;
export const collectionQueryKey = (id: string) => ['collection', id] as const;

/**
 * `GET /api/agent/collections` (RealtorGuard) → this realtor's collections, newest
 * first, each with its item count. Powers the "Kolleksiyalarim" list, the picker
 * on the browse cards, and the dashboard count.
 */
export function useCollections() {
  return useQuery({
    queryKey: COLLECTIONS_QUERY_KEY,
    queryFn: () => apiGet('/api/agent/collections', CollectionSummaryArraySchema),
    staleTime: 30 * 1000,
  });
}

/**
 * `GET /api/agent/collections/:id` → one collection with its items ordered by
 * position asc, each joined to its ListingSummary. `enabled` lets a caller skip
 * the fetch until an id is actually in hand.
 */
export function useCollection(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: collectionQueryKey(id),
    queryFn: () => apiGet(`/api/agent/collections/${id}`, CollectionDetailSchema),
    enabled: enabled && id !== '',
  });
}

/**
 * `POST /api/agent/collections` ({ name }) → the new CollectionSummary. Only the
 * list changes, so only `['collections']` is invalidated.
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiPost('/api/agent/collections', CollectionSummarySchema, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
    },
  });
}

/**
 * `PATCH /api/agent/collections/:id` ({ name }). The name shows on both the list
 * and the detail header, so both keys are invalidated.
 */
export function useRenameCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiPatch(`/api/agent/collections/${id}`, CollectionSummarySchema, { name }),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: collectionQueryKey(id) });
    },
  });
}

/**
 * `DELETE /api/agent/collections/:id`. Drops the detail cache entry and refreshes
 * the list.
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/agent/collections/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: collectionQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
    },
  });
}

/**
 * `POST /api/agent/collections/:id/items` ({ listingId }) → the fresh
 * CollectionDetail (idempotent server-side — re-adding keeps the existing row).
 * The response seeds the detail cache for an instant reflect; both keys are then
 * invalidated since itemCount/updatedAt on the summary also move.
 */
export function useAddCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, listingId }: { collectionId: string; listingId: string }) =>
      apiPost(`/api/agent/collections/${collectionId}/items`, CollectionDetailSchema, {
        listingId,
      }),
    onSuccess: (detail, { collectionId }) => {
      queryClient.setQueryData<CollectionDetail>(collectionQueryKey(collectionId), detail);
      void queryClient.invalidateQueries({ queryKey: collectionQueryKey(collectionId) });
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
    },
  });
}

/**
 * `DELETE /api/agent/collections/:id/items/:listingId` → the fresh CollectionDetail.
 * Same cache handling as add.
 */
export function useRemoveCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, listingId }: { collectionId: string; listingId: string }) =>
      apiDelete(
        `/api/agent/collections/${collectionId}/items/${listingId}`,
        CollectionDetailSchema,
      ),
    onSuccess: (detail, { collectionId }) => {
      queryClient.setQueryData<CollectionDetail>(collectionQueryKey(collectionId), detail);
      void queryClient.invalidateQueries({ queryKey: collectionQueryKey(collectionId) });
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
    },
  });
}

/**
 * `PATCH /api/agent/collections/:id/items` ({ listingIds }) — the FULL ordered list
 * of listingIds. Returns the reordered CollectionDetail, which seeds the detail
 * cache; both keys are invalidated (updatedAt moves on the summary).
 */
export function useReorderCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, listingIds }: { collectionId: string; listingIds: string[] }) =>
      apiPatch(`/api/agent/collections/${collectionId}/items`, CollectionDetailSchema, {
        listingIds,
      }),
    onSuccess: (detail, { collectionId }) => {
      queryClient.setQueryData<CollectionDetail>(collectionQueryKey(collectionId), detail);
      void queryClient.invalidateQueries({ queryKey: collectionQueryKey(collectionId) });
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
    },
  });
}
