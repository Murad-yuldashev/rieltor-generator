import { queryOptions } from '@tanstack/react-query';
import { ModeratorArticleDetailSchema, ModeratorArticleRowSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/** Shared so every mutation (publish, save, cover) invalidates the same list. */
export const MODERATION_JOURNAL_KEY = ['moderation-journal'] as const;

/**
 * The moderator's article roster (GET /api/moderation/journal) — every article,
 * drafts included, newest edit first. Bearer-token gated on the API side; the page
 * also checks the session role before it ever fires. Mirrors the developer roster.
 */
export const journalListQuery = queryOptions({
  queryKey: MODERATION_JOURNAL_KEY,
  queryFn: () => apiGet('/api/moderation/journal', z.array(ModeratorArticleRowSchema)),
});

/**
 * One article's full editor payload (GET /api/moderation/journal/:id) — loaded when
 * a row's edit button opens the form. Keyed under the list key so a cover upload can
 * invalidate exactly this detail.
 */
export function journalDetailQuery(id: string) {
  return queryOptions({
    queryKey: [...MODERATION_JOURNAL_KEY, id],
    queryFn: () => apiGet(`/api/moderation/journal/${id}`, ModeratorArticleDetailSchema),
  });
}
