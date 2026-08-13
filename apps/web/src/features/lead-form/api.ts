import { LEAD_HONEYPOT_FIELD, type LeadCreate } from '@rieltor/shared';
import * as z from 'zod';
import { apiPost } from '@/shared/api/client';

const LeadCreateResultSchema = z.object({ id: z.string() });

/**
 * POST /api/leads (design spec §8.4) — public, no auth, the "Raqamimni qoldiraman"
 * CTA on a listing page. `input` is the shared LeadCreateSchema shape (listingId,
 * name, phone); `honeypot` is appended separately under LEAD_HONEYPOT_FIELD's
 * actual key so this keeps working even if that key name ever changes — it is
 * transport-level anti-spam, not part of the lead's own data (see
 * packages/shared/src/leads.ts and apps/api/src/leads/leads.dto.ts).
 */
export function createLead(input: LeadCreate, honeypot: string): Promise<{ id: string }> {
  return apiPost('/api/leads', LeadCreateResultSchema, {
    ...input,
    [LEAD_HONEYPOT_FIELD]: honeypot,
  });
}
