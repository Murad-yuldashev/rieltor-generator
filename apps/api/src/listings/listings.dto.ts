import { createZodDto } from 'nestjs-zod';
import { ListingDetailSchema, ListingSummarySchema } from '@rieltor/shared';

// The Swagger schema is generated from these classes; the types still come from @rieltor/shared.
export class ListingDetailDto extends createZodDto(ListingDetailSchema) {}
export class ListingSummaryDto extends createZodDto(ListingSummarySchema) {}
