import * as z from 'zod';

/**
 * One calendar day's USD/UZS rate, fetched from CBU by the stage-4 daily cron and
 * used by ListingsWriteService to auto-convert whichever currency a realtor did not
 * type (design spec §7.5, §7.6).
 */
export const FxRateSchema = z.object({
  /** YYYY-MM-DD. */
  date: z.string(),
  /** How many so'm one US dollar is worth on `date`. */
  usdRate: z.number().positive(),
  /** When this row was written — may be later than `date` if a fetch was retried. */
  fetchedAt: z.string(),
});

export type FxRate = z.infer<typeof FxRateSchema>;
