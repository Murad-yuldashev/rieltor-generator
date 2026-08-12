import { createZodDto } from 'nestjs-zod';
import { EventCreateSchema, ListingStatsSchema } from '@rieltor/shared';

export class EventCreateDto extends createZodDto(EventCreateSchema) {}
export class ListingStatsDto extends createZodDto(ListingStatsSchema) {}
