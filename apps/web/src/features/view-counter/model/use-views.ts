import { useQuery } from '@tanstack/react-query';
import { ViewsSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

const key = (id: string) => `viewed:${id}`;

function hasViewed(id: string): boolean {
  try {
    return sessionStorage.getItem(key(id)) === '1';
  } catch {
    // Private rejimda sessionStorage tashlashi mumkin — hisoblagich baribir ishlasin.
    return false;
  }
}

function markViewed(id: string): void {
  try {
    sessionStorage.setItem(key(id), '1');
  } catch {
    /* e'tiborsiz */
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
    // Degradatsiya (spec §6.3): xatoda qayta urinilmaydi va sahifa bloklanmaydi.
    retry: false,
    staleTime: Infinity,
  });

  return { views: data?.views ?? null };
}
