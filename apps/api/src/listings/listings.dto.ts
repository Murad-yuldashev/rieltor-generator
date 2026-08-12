import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import {
  ListingDetailSchema,
  ListingInputSchema,
  ListingStatusSchema,
  ListingSummarySchema,
  OwnerListingDetailSchema,
  OwnerListingSummarySchema,
} from '@rieltor/shared';

// The Swagger schema is generated from these classes; the types still come from @rieltor/shared.
export class ListingDetailDto extends createZodDto(ListingDetailSchema) {}
export class ListingSummaryDto extends createZodDto(ListingSummarySchema) {}
export class ListingInputDto extends createZodDto(ListingInputSchema) {}
export class OwnerListingSummaryDto extends createZodDto(OwnerListingSummarySchema) {}
export class OwnerListingDetailDto extends createZodDto(OwnerListingDetailSchema) {}

/** Body of POST /api/objects/:id/status. */
export const ListingStatusChangeSchema = z.object({ to: ListingStatusSchema });
export class ListingStatusChangeDto extends createZodDto(ListingStatusChangeSchema) {}
