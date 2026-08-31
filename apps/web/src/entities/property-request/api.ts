import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LeadClaimResponseSchema,
  LeadSchema,
  PropertyRequestSummarySchema,
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

/**
 * The realtor lead feed (`GET /api/leads`, RealtorGuard) — OPEN leads ordered by
 * score desc, each with a masked phone. The endpoint takes no filter params, so
 * the board applies its filter client-side over the returned rows.
 */
export const leadsQuery = () =>
  queryOptions({
    queryKey: ['leads'] as const,
    queryFn: () => apiGet('/api/leads', z.array(LeadSchema)),
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

/**
 * Exclusively claims a lead (`POST /api/leads/:id/claim`, RealtorGuard) — returns
 * the buyer's real `{ phone, name }`, or 409 if another realtor already took it,
 * 400 on a self-claim, 402 when the wallet balance can't cover the lead price. On
 * success the feed is invalidated so the now-CLAIMED lead drops out of the OPEN
 * list, and the wallet too, since the claim debited the balance.
 */
export function useClaimLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/api/leads/${id}/claim`, LeadClaimResponseSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
