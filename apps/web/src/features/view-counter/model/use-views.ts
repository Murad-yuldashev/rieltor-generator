import { useQuery } from '@tanstack/react-query';
import { ViewsSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

const key = (id: string) => `viewed:${id}`;

function hasViewed(id: string): boolean {
  try {
    return sessionStorage.getItem(key(id)) === '1';
  } catch {
    // sessionStorage can throw in private mode — the counter should still work.
    return false;
  }
}

function markViewed(id: string): void {
  try {
    sessionStorage.setItem(key(id), '1');
  } catch {
    /* ignored */
  }
}

export function useViews(id: string): { views: number | null } {
  const { data } = useQuery({
    queryKey: ['views', id] as const,
    queryFn: async () => {
      if (hasViewed(id)) {
        return apiGet(`/api/view/${id}`, ViewsSchema);
      }
      const result = await apiPost(`/api/view/${id}`, ViewsSchema);
      markViewed(id);
      return result;
    },
    // Graceful degradation (spec §6.3): no retry on error, never blocks the page.
    retry: false,
    staleTime: Infinity,
  });

  return { views: data?.views ?? null };
}
