import { useQuery } from '@tanstack/react-query';
import { ViewsSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

const kalit = (id: string) => `viewed:${id}`;

function korilganmi(id: string): boolean {
  try {
    return sessionStorage.getItem(kalit(id)) === '1';
  } catch {
    // Private rejimda sessionStorage tashlashi mumkin — hisoblagich baribir ishlasin.
    return false;
  }
}

function belgila(id: string): void {
  try {
    sessionStorage.setItem(kalit(id), '1');
  } catch {
    /* e'tiborsiz */
  }
}

export function useViews(id: string): { views: number | null } {
  const { data } = useQuery({
    queryKey: ['views', id] as const,
    queryFn: async () => {
      if (korilganmi(id)) {
        return apiGet(`/api/view/${id}`, ViewsSchema);
      }
      const natija = await apiPost(`/api/view/${id}`, ViewsSchema);
      belgila(id);
      return natija;
    },
    // Degradatsiya (spec §6.3): xatoda qayta urinilmaydi va sahifa bloklanmaydi.
    retry: false,
    staleTime: Infinity,
  });

  return { views: data?.views ?? null };
}
