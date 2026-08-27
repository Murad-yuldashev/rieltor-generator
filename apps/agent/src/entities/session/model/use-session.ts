import { useQuery } from '@tanstack/react-query';
import { AuthUserSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';
import { readTokens } from '@/shared/api/auth-storage';

export function useSession() {
  const hasTokens = readTokens() !== null;

  const { data, isPending } = useQuery({
    queryKey: ['session'],
    queryFn: () => apiGet('/api/auth/me', AuthUserSchema),
    // Without a token there is nothing to ask about, and firing the request
    // anyway would make every anonymous page load a guaranteed 401.
    enabled: hasTokens,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: data ?? null,
    isPending: hasTokens && isPending,
    isAuthenticated: Boolean(data),
  };
}
