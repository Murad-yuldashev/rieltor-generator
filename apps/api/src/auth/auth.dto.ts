import { createZodDto } from 'nestjs-zod';
import { RealtorProfileSchema, TelegramAuthSchema } from '@rieltor/shared';

// The Swagger schema is generated from these classes; the types come from @rieltor/shared.
export class TelegramAuthDto extends createZodDto(TelegramAuthSchema) {}
export class RealtorProfileDto extends createZodDto(RealtorProfileSchema) {}
