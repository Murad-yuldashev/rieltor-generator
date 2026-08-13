import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadSchema, type Lead, type LeadStatus } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet, apiPatch } from '@/shared/api/client';

/** GET /api/me/leads (design spec §8.4) — owner-only, newest first (server-sorted). */
export const myLeadsQuery = () =>
  queryOptions({
    queryKey: ['myLeads'] as const,
    queryFn: (): Promise<Lead[]> => apiGet('/api/me/leads', z.array(LeadSchema)),
  });

/** PATCH /api/me/leads/:id — returns the full updated lead, not just the status. */
function advanceLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return apiPatch(`/api/me/leads/${id}`, LeadSchema, { status });
}

/**
 * Self-contained, like features/favorites's useFavorite: each lead row calls this on
 * its own rather than one mutation instance being threaded down through props, since
 * (unlike listing-form's StatusBar) no sibling UI needs to react to the result.
 */
export function useAdvanceLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      advanceLeadStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['myLeads'], (old: Lead[] | undefined) =>
        old?.map((lead) => (lead.id === updated.id ? updated : lead)),
      );
    },
  });
}
