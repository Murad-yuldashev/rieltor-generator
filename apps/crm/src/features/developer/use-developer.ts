import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrganizationSchema, type BecomeDeveloper } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

export const ORG_QUERY_KEY = ['crm-org'] as const;

// `useSession` reads `queryKey: ['session']` (the copied agent hook exports no
// key constant), so the literal below MUST match it — invalidating it after the
// upgrade makes every gate re-read the fresh role.
const SESSION_QUERY_KEY = ['session'] as const;

/**
 * `GET /api/crm/org` — the caller's developer organization plus its members. The
 * endpoint is DeveloperGuard-protected on the server, so `enabled` lets the guard
 * skip the fetch until the role is known to be DEVELOPER (a USER would only 403).
 */
export function useOrg(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ORG_QUERY_KEY,
    queryFn: () => apiGet('/api/crm/org', OrganizationSchema),
    enabled: opts?.enabled ?? true,
  });
}

/**
 * `POST /api/crm/become-developer` — USER → DEVELOPER and creates the org. On
 * success we invalidate the session (the role flipped to DEVELOPER, so the guard
 * must re-read it and open the cabinet) and the org query (now there is a row to
 * fetch). Idempotent on the server.
 */
export function useBecomeDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: BecomeDeveloper) =>
      apiPost('/api/crm/become-developer', OrganizationSchema, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEY });
    },
  });
}
