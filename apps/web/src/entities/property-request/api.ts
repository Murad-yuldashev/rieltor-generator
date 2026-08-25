import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PropertyRequestSummarySchema,
  RevealedContactSchema,
  type PropertyRequestCreate,
  type PropertyRequestFilter,
} from '@rieltor/shared';
import * as z from 'zod';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';

/** Serialises the board filter into `GET /api/requests` query params. */
function toQuery(filter: PropertyRequestFilter): string {
  const params = new URLSearchParams();
  if (filter.deal) params.set('deal', filter.deal);
  if (filter.type) params.set('type', filter.type);
  if (filter.district) params.set('district', filter.district);
  if (filter.roomsMin != null) params.set('roomsMin', String(filter.roomsMin));
  if (filter.priceMaxSom) params.set('priceMaxSom', filter.priceMaxSom);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const requestsQuery = (filter: PropertyRequestFilter) =>
  queryOptions({
    queryKey: ['requests', filter] as const,
    queryFn: () => apiGet(`/api/requests${toQuery(filter)}`, z.array(PropertyRequestSummarySchema)),
  });

export const myRequestsQuery = () =>
  queryOptions({
    queryKey: ['my-requests'] as const,
    queryFn: () => apiGet('/api/my/requests', z.array(PropertyRequestSummarySchema)),
  });

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PropertyRequestCreate) =>
      apiPost('/api/requests', PropertyRequestSummarySchema, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-requests'] }),
  });
}

export function useCloseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/api/requests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-requests'] }),
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/requests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-requests'] }),
  });
}

export function useRevealRequestContact() {
  return useMutation({
    mutationFn: (id: string) => apiPost(`/api/requests/${id}/contact`, RevealedContactSchema),
  });
}
