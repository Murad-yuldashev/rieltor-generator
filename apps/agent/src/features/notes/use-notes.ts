import { useQuery } from '@tanstack/react-query';
import { NoteWithListingSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

const NoteWithListingArraySchema = z.array(NoteWithListingSchema);

export const NOTES_QUERY_KEY = ['notes'] as const;

/**
 * `GET /api/agent/notes` (RealtorGuard) → all of this realtor's notes, newest
 * first, each joined to its listing summary. Powers the "Mening eslatmalarim"
 * page, the dashboard count, and the "has a note" state on the browse cards.
 */
export function useNotes() {
  return useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: () => apiGet('/api/agent/notes', NoteWithListingArraySchema),
    staleTime: 30 * 1000,
  });
}
