import * as z from 'zod';
import { PhoneSchema } from './realtor';

export const LeadStatusSchema = z.enum(['NEW', 'CONTACTED', 'MEETING', 'CLOSED']);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

/**
 * POST /api/leads body — the "leave your number" form on a listing page (design
 * spec §8.4). The API additionally requires a honeypot field to arrive empty; that
 * lives outside this schema (apps/api/src/leads/leads.dto.ts) since it is
 * transport-level anti-spam, not part of the lead's actual data. Its field name is
 * LEAD_HONEYPOT_FIELD below, so the web form and the API agree on it.
 */
export const LeadCreateSchema = z.object({
  listingId: z.string(),
  name: z.string().min(2, "Ism kamida 2 belgi bo'lsin").max(60),
  phone: PhoneSchema,
});
export type LeadCreate = z.infer<typeof LeadCreateSchema>;

/** A lead as returned by GET /api/me/leads and PATCH /api/me/leads/:id. */
export const LeadSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  name: z.string(),
  phone: z.string(),
  status: LeadStatusSchema,
  createdAt: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

/**
 * The lifecycle table from design spec §8.4, as a pure lookup: forward-only
 * NEW → CONTACTED → MEETING → CLOSED, or a direct jump to CLOSED from any status
 * (closing or dropping a lead does not require clicking through every step).
 * CLOSED is terminal. No role parameter — unlike allowedTransitions for listings,
 * only the owning realtor ever moves a lead's status.
 */
export function nextLeadStatuses(status: LeadStatus): LeadStatus[] {
  const table: Record<LeadStatus, LeadStatus[]> = {
    NEW: ['CONTACTED', 'CLOSED'],
    CONTACTED: ['MEETING', 'CLOSED'],
    MEETING: ['CLOSED'],
    CLOSED: [],
  };
  return table[status];
}

/**
 * Hidden field name for the lead form's honeypot input — real visitors never fill
 * it in (it is invisible), a bot that auto-fills every input trips it. Shared so
 * the web form and the API's POST /api/leads body agree on the name without
 * either side hardcoding a string the other cannot see.
 */
export const LEAD_HONEYPOT_FIELD = 'website';
