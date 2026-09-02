import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  BuildingSchema,
  ComplexDetailSchema,
  ComplexSchema,
  OrganizationSchema,
  type BecomeDeveloper,
  type BuildingCreate,
  type ComplexCreate,
  type ComplexUpdate,
} from '@rieltor/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';

export const ORG_QUERY_KEY = ['crm-org'] as const;

// The complex list and per-complex detail caches. Kept as named builders so the
// query that fills a key and the mutation that invalidates it can never drift.
export const COMPLEXES_QUERY_KEY = ['crm-complexes'] as const;
export const complexQueryKey = (id: string) => ['crm-complex', id] as const;

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

/** `GET /api/crm/complexes` — every complex owned by the caller's organization. */
export function useComplexes() {
  return useQuery({
    queryKey: COMPLEXES_QUERY_KEY,
    queryFn: () => apiGet('/api/crm/complexes', z.array(ComplexSchema)),
  });
}

/** `GET /api/crm/complexes/:id` — one complex plus its buildings. */
export function useComplex(id: string) {
  return useQuery({
    queryKey: complexQueryKey(id),
    queryFn: () => apiGet(`/api/crm/complexes/${id}`, ComplexDetailSchema),
  });
}

/** `POST /api/crm/complexes` — create a complex, then refresh the list. */
export function useCreateComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ComplexCreate) => apiPost('/api/crm/complexes', ComplexSchema, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: COMPLEXES_QUERY_KEY }),
  });
}

/**
 * `PATCH /api/crm/complexes/:id` — edit a complex. Refreshes both the list (name,
 * district and the status badge may have changed) and this complex's detail.
 */
export function useUpdateComplex(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ComplexUpdate) => apiPatch(`/api/crm/complexes/${id}`, ComplexSchema, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMPLEXES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: complexQueryKey(id) });
    },
  });
}

/** `DELETE /api/crm/complexes/:id` — remove a complex, then refresh the list. */
export function useDeleteComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/crm/complexes/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: COMPLEXES_QUERY_KEY }),
  });
}

/**
 * `POST /api/crm/complexes/:id/buildings` — add a building to a complex. Only the
 * owning complex's detail (which carries the buildings list) needs refreshing.
 */
export function useCreateBuilding(complexId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: BuildingCreate) =>
      apiPost(`/api/crm/complexes/${complexId}/buildings`, BuildingSchema, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: complexQueryKey(complexId) }),
  });
}
