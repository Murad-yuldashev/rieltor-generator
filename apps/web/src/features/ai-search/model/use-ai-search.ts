import { useMutation } from '@tanstack/react-query';
import { AiSearchResponseSchema, type AiSearchResponse } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/** Parse an NL query into criteria. Any network/HTTP error resolves to a client-side fallback
 *  so a failure never blocks the search (the endpoint itself already returns fallback for AI issues). */
export function useAiSearch() {
  return useMutation<AiSearchResponse, never, string>({
    mutationFn: async (query: string) => {
      try {
        return await apiPost('/api/ai/search-parse', AiSearchResponseSchema, { query });
      } catch {
        return { fallback: true, criteria: { search: query }, summary: '' };
      }
    },
  });
}
