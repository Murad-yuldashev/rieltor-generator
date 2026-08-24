import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SavedSearchSchema, type SavedSearchCreate } from '@rieltor/shared';
import * as z from 'zod';
import { useSession } from '@/entities/session';
import { apiDelete, apiGet, apiPost } from '@/shared/api/client';

/** Shared by every hook here so a create/delete always invalidates the same list. */
const SAVED_SEARCHES_KEY = ['saved-searches'] as const;

/**
 * The my-listings cabinet's saved-searches section: the caller's list, newest
 * first, plus a delete action. Gated on `useSession()` the same way the page
 * around it is — logged out means nothing to fetch.
 */
export function useSavedSearches() {
  const { isAuthenticated } = useSession();

  const query = useQuery({
    queryKey: SAVED_SEARCHES_KEY,
    queryFn: () => apiGet('/api/my/saved-searches', z.array(SavedSearchSchema)),
    enabled: isAuthenticated,
  });

  const queryClient = useQueryClient();
  const removeMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/my/saved-searches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVED_SEARCHES_KEY }),
  });

  return {
    savedSearches: query.data ?? [],
    isPending: isAuthenticated && query.isPending,
    remove: (id: string) => removeMutation.mutate(id),
    isRemoving: removeMutation.isPending,
  };
}

/**
 * Just the create side — used by the home page's "Qidiruvni saqlash" button,
 * which has no need for the list itself. Still invalidates `SAVED_SEARCHES_KEY`
 * so the cabinet's list is fresh whenever the user next opens it.
 */
export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (body: SavedSearchCreate) =>
      apiPost('/api/my/saved-searches', SavedSearchSchema, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVED_SEARCHES_KEY }),
  });

  return {
    create: (body: SavedSearchCreate) => createMutation.mutateAsync(body),
    isCreating: createMutation.isPending,
  };
}
