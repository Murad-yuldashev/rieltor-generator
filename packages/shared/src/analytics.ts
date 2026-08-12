import * as z from 'zod';

export const EventTypeSchema = z.enum(['VIEW', 'CALL_CLICK', 'TG_CLICK']);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * POST /api/event body — recorded on page open (VIEW) and CTA taps (CALL_CLICK,
 * TG_CLICK). shareCode is the page's `?s=` query param, when the visit came from a
 * ShareLink; omitted for organic/direct traffic (design spec §8.2).
 */
export const EventCreateSchema = z.object({
  listingId: z.string(),
  type: EventTypeSchema,
  shareCode: z.string().optional(),
});
export type EventCreate = z.infer<typeof EventCreateSchema>;

export const StatsWindowSchema = z.object({
  views: z.number().int(),
  callClicks: z.number().int(),
  tgClicks: z.number().int(),
});
export type StatsWindow = z.infer<typeof StatsWindowSchema>;

/** One row of the by-source breakdown. Null shareCode/label means direct traffic. */
export const ShareBreakdownItemSchema = StatsWindowSchema.extend({
  shareCode: z.string().nullable(),
  label: z.string().nullable(),
});
export type ShareBreakdownItem = z.infer<typeof ShareBreakdownItemSchema>;

/** GET /api/me/stats and GET /api/me/objects/:id/stats (design spec §8.3). */
export const ListingStatsSchema = z.object({
  last7d: StatsWindowSchema,
  last30d: StatsWindowSchema,
  /** Grouped by ShareLink code/label, over the last30d window. */
  byShare: z.array(ShareBreakdownItemSchema),
});
export type ListingStats = z.infer<typeof ListingStatsSchema>;
