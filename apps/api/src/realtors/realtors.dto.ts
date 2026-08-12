import { createZodDto } from 'nestjs-zod';
import { RealtorProfileUpdateSchema, RealtorShowcaseSchema } from '@rieltor/shared';

// The response DTO already exists in auth.dto.ts — re-exported, not redefined, so
// Swagger shows one schema instead of two identical ones.
export { RealtorProfileDto } from '../auth/auth.dto';

export class RealtorProfileUpdateDto extends createZodDto(RealtorProfileUpdateSchema) {}

/** GET /api/realtors/:username response (design spec §9.1). */
export class RealtorShowcaseDto extends createZodDto(RealtorShowcaseSchema) {}
