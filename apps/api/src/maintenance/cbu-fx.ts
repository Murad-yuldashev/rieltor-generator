import * as z from 'zod';

const CBU_USD_URL = 'https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/';

/** Only the fields this module reads from CBU's response — it returns many more. */
const CbuRateEntrySchema = z.object({
  Ccy: z.string().optional(),
  Rate: z.string(),
});
const CbuResponseSchema = z.array(CbuRateEntrySchema).min(1);

/**
 * CBU's current USD/UZS rate (how many so'm one dollar is worth). Throws on any
 * network, HTTP, or shape failure — the caller (MaintenanceService.refreshFxRate) is
 * the one responsible for catching this and falling back to the last saved FxRate
 * row, per design spec §7.5: a flaky external API must never take the whole cron
 * run down. `fetchImpl` defaults to the global fetch (Node 22+) and exists only so a
 * caller can substitute a stand-in.
 */
export async function fetchCbuUsdRate(fetchImpl: typeof fetch = fetch): Promise<number> {
  const res = await fetchImpl(CBU_USD_URL);
  if (!res.ok) throw new Error(`CBU javob berdi: HTTP ${res.status}`);

  const json: unknown = await res.json();
  const entries = CbuResponseSchema.parse(json);
  const entry = entries.find((e) => e.Ccy === 'USD') ?? entries[0]!;

  const rate = Number(entry.Rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`CBU kursi noto'g'ri qiymat qaytardi: ${entry.Rate}`);
  }
  return rate;
}
