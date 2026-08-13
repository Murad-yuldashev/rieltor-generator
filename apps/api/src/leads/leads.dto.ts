import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import { LeadCreateSchema, LeadSchema, LeadStatusSchema } from '@rieltor/shared';

/**
 * The wire body for POST /api/leads: the shared LeadCreateSchema plus a honeypot
 * field real visitors never fill in (design spec §8.4). Kept out of
 * @rieltor/shared's LeadCreateSchema itself — that schema is the lead's actual
 * data, this field is transport-level anti-spam. The key must match
 * LEAD_HONEYPOT_FIELD exported from @rieltor/shared.
 */
export const LeadCreateBodySchema = LeadCreateSchema.extend({
  website: z.string().optional(),
});
export class LeadCreateDto extends createZodDto(LeadCreateBodySchema) {}

export class LeadDto extends createZodDto(LeadSchema) {}

/** Body of PATCH /api/me/leads/:id. */
export const LeadStatusUpdateSchema = z.object({ status: LeadStatusSchema });
export class LeadStatusUpdateDto extends createZodDto(LeadStatusUpdateSchema) {}
