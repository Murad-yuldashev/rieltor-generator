import { createZodDto } from 'nestjs-zod';
import { ListingDetailSchema, ListingSummarySchema } from '@rieltor/shared';

// Swagger sxemasi shu sinflardan generatsiya qilinadi — tip manbasi baribir @rieltor/shared.
export class ListingDetailDto extends createZodDto(ListingDetailSchema) {}
export class ListingSummaryDto extends createZodDto(ListingSummarySchema) {}
