import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NoteWithListingSchema } from '@rieltor/shared';
import { apiDelete, apiGet, apiPut } from '@/shared/api/client';
import { NOTES_QUERY_KEY } from './use-notes';

/**
 * A single note carries no embedded listing — that shape only exists on the list
 * endpoint. `GET /api/agent/notes/:listingId` returns `{ listingId, body,
 * updatedAt }` or `null`, so the schema is `NoteWithListing` minus its `listing`
 * field, made nullable.
 */
const NoteSchema = NoteWithListingSchema.omit({ listing: true });
const NullableNoteSchema = NoteSchema.nullable();

export const noteQueryKey = (listingId: string) => ['note', listingId] as const;

/**
 * The private note for one listing (RealtorGuard). `enabled` lets the editor skip
 * the fetch until it is actually opened for a given listing.
 */
export function useNote(listingId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: noteQueryKey(listingId),
    queryFn: () => apiGet(`/api/agent/notes/${listingId}`, NullableNoteSchema),
    enabled,
  });
}

/**
 * `PUT /api/agent/notes/:listingId` — upsert the single note for (realtor,
 * listing). On success the fresh note seeds its own cache entry, then both the
 * note and the list are invalidated so the browse buttons and "Mening
 * eslatmalarim" reflect the change.
 */
export function useSaveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, body }: { listingId: string; body: string }) =>
      apiPut(`/api/agent/notes/${listingId}`, NoteSchema, { body }),
    onSuccess: (note) => {
      queryClient.setQueryData(noteQueryKey(note.listingId), note);
      void queryClient.invalidateQueries({ queryKey: noteQueryKey(note.listingId) });
      void queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

/**
 * `DELETE /api/agent/notes/:listingId` — removes the note (idempotent server-side).
 * The cache entry is cleared to null and both keys are invalidated.
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => apiDelete(`/api/agent/notes/${listingId}`),
    onSuccess: (_data, listingId) => {
      queryClient.setQueryData(noteQueryKey(listingId), null);
      void queryClient.invalidateQueries({ queryKey: noteQueryKey(listingId) });
      void queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}
