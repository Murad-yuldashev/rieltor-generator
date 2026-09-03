import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  BuildingSchema,
  ComplexDetailSchema,
  ComplexSchema,
  OrganizationSchema,
  UnitSchema,
  type BecomeDeveloper,
  type BuildingCreate,
  type BuildingUpdate,
  type ComplexCreate,
  type ComplexUpdate,
  type UnitCreate,
  type UnitUpdate,
} from '@rieltor/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';

export const ORG_QUERY_KEY = ['crm-org'] as const;

// The complex list and per-complex detail caches. Kept as named builders so the
// query that fills a key and the mutation that invalidates it can never drift.
export const COMPLEXES_QUERY_KEY = ['crm-complexes'] as const;
export const complexQueryKey = (id: string) => ['crm-complex', id] as const;

// The per-building units cache. Same named-builder discipline: the query that
// fills the key and every unit mutation that invalidates it share this builder.
export const unitsQueryKey = (buildingId: string) => ['crm-units', buildingId] as const;

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

/**
 * `POST /api/crm/organization/verification-request` — the org asks a moderator to
 * grant its verified badge. Returns the org self-view (now with
 * `verificationRequestedAt` set), so we refresh the org query to flip the status
 * to "Kutilmoqda". No body.
 */
export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost('/api/crm/organization/verification-request', OrganizationSchema),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEY }),
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

/**
 * `PATCH /api/crm/complexes/:id/publish` — flip a complex between DRAFT and
 * PUBLISHED. The server gates publish on org verification, at least one image and
 * a priced available unit; a failed gate comes back as a 409 whose Uzbek `message`
 * the caller surfaces (ApiError carries it). Refreshes the list (the badge changed)
 * and this complex's detail.
 */
export function usePublishComplex(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publish: boolean) =>
      apiPatch(`/api/crm/complexes/${id}/publish`, ComplexSchema, { publish }),
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

/**
 * `PATCH /api/crm/buildings/:id` — rename a building or change its floor count.
 * Keyed by the parent `complexId` (not the building's own id): the buildings list
 * lives on the complex's detail, so that is the cache to refresh on success.
 */
export function useUpdateBuilding(complexId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ buildingId, ...body }: { buildingId: string } & BuildingUpdate) =>
      apiPatch(`/api/crm/buildings/${buildingId}`, BuildingSchema, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: complexQueryKey(complexId) }),
  });
}

/** `DELETE /api/crm/buildings/:id` — remove a building, then refresh its complex. */
export function useDeleteBuilding(complexId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (buildingId: string) => apiDelete(`/api/crm/buildings/${buildingId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: complexQueryKey(complexId) }),
  });
}

/** `GET /api/crm/buildings/:id/units` — every unit in a building. */
export function useUnits(buildingId: string) {
  return useQuery({
    queryKey: unitsQueryKey(buildingId),
    queryFn: () => apiGet(`/api/crm/buildings/${buildingId}/units`, z.array(UnitSchema)),
  });
}

/** `POST /api/crm/buildings/:id/units` — add a unit, then refresh the building's list. */
export function useCreateUnit(buildingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UnitCreate) =>
      apiPost(`/api/crm/buildings/${buildingId}/units`, UnitSchema, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: unitsQueryKey(buildingId) }),
  });
}

/**
 * `PATCH /api/crm/units/:id` — edit a unit (status change or the numeric fields).
 * The hook takes the owning `buildingId` for invalidation; the mutate call carries
 * the `unitId` (units are addressed by their own id server-side) plus the changed
 * fields.
 */
export function useUpdateUnit(buildingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unitId, ...body }: { unitId: string } & UnitUpdate) =>
      apiPatch(`/api/crm/units/${unitId}`, UnitSchema, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: unitsQueryKey(buildingId) }),
  });
}

/** `DELETE /api/crm/units/:id` — remove a unit, then refresh the building's list. */
export function useDeleteUnit(buildingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (unitId: string) => apiDelete(`/api/crm/units/${unitId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: unitsQueryKey(buildingId) }),
  });
}
