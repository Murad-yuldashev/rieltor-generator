import * as z from 'zod';
import { DealSchema, ListingTypeSchema } from './schemas';

/**
 * The editable fields of a listing. Every field is optional so a DRAFT can be
 * saved half-filled; completeness is enforced only at publish (below). priceSom is
 * a string end-to-end — a BigInt need not fit in a number.
 */
export const ListingInputSchema = z.object({
  title: z.string().max(120).optional(),
  priceSom: z.string().regex(/^\d+$/, "Narx faqat raqamlardan iborat bo'lsin").optional(),
  priceUsd: z.number().int().nonnegative().optional(),
  rooms: z.number().int().positive().nullable().optional(),
  areaM2: z.number().positive().optional(),
  floor: z.string().max(20).nullable().optional(),
  district: z.string().max(60).optional(),
  address: z.string().max(200).optional(),
  landmark: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  type: ListingTypeSchema.optional(),
  deal: DealSchema.optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export type ListingInput = z.infer<typeof ListingInputSchema>;

/**
 * The intrinsic fields a listing must carry before it can go live (§7.4). The two
 * cross-entity rules — at least one image, and the realtor's phone — are checked in
 * the service, which can see the image rows and the realtor row. COMMERCIAL premises
 * are not measured in rooms, so rooms is required only for the other three types.
 */
export const PublishableListingSchema = z
  .object({
    title: z.string().min(10, "Sarlavha kamida 10 belgi bo'lsin"),
    priceSom: z.string().regex(/^[1-9]\d*$/, 'Narx kiritilishi kerak'),
    priceUsd: z.number().int().positive(),
    areaM2: z.number().positive(),
    district: z.string().min(1, 'Tuman kiritilishi kerak'),
    type: ListingTypeSchema,
    deal: DealSchema,
    rooms: z.number().int().positive().nullable(),
  })
  .refine((v) => v.type === 'COMMERCIAL' || v.rooms !== null, {
    message: 'Xonalar soni kiritilishi kerak',
    path: ['rooms'],
  });

export type PublishableListing = z.infer<typeof PublishableListingSchema>;
