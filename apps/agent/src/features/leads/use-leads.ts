import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LeadSchema,
  LeadStatsSchema,
  type LeadOutcomeStage,
  type LeadLostReason,
} from '@rieltor/shared';
import * as z from 'zod';
import { apiGet, apiPatch } from '@/shared/api/client';

export const MY_LEADS_KEY = ['my-leads'] as const;
export const LEAD_STATS_KEY = ['lead-stats'] as const;

/**
 * The realtor's own claimed leads (`GET /api/leads/mine`) — each row carries the
 * revealed `phone` plus the recorded outcome (`outcomeStage`/`lostReason`). Only
 * ever runs inside the cabinet (CabinetGuard), where the caller is a REALTOR.
 */
export function useMyLeads() {
  return useQuery({
    queryKey: MY_LEADS_KEY,
    queryFn: () => apiGet('/api/leads/mine', z.array(LeadSchema)),
  });
}

/**
 * The realtor's personal conversion analytics (`GET /api/leads/stats`) — the
 * outcome funnel, win rate, and loss-reason breakdown that head the page.
 */
export function useLeadStats() {
  return useQuery({
    queryKey: LEAD_STATS_KEY,
    queryFn: () => apiGet('/api/leads/stats', LeadStatsSchema),
  });
}

/**
 * `PATCH /api/leads/:id/outcome` — record a claimed lead's outcome stage (and, for
 * LOST, the reason). Invalidating BOTH keys on success repaints the leads list and
 * the funnel stats with server truth.
 */
export function useSetOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; stage: LeadOutcomeStage; lostReason?: LeadLostReason }) =>
      apiPatch(`/api/leads/${vars.id}/outcome`, LeadSchema, {
        stage: vars.stage,
        lostReason: vars.lostReason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_LEADS_KEY });
      void queryClient.invalidateQueries({ queryKey: LEAD_STATS_KEY });
    },
  });
}
