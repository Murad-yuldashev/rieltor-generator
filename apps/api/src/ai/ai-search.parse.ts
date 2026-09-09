import {
  AiSearchCriteriaSchema,
  type AiSearchCriteria,
  type AiSearchResponse,
  type ListingType,
} from '@rieltor/shared';

/** Uzbek instruction telling Gemini to emit ONLY the allowed JSON fields. The server never
 *  relies on the model obeying — it validates (buildSearchResponse). */
export function buildSearchPrompt(query: string): string {
  return [
    "Sen O'zbekistonda ko'chmas mulk qidiruv so'rovini JSON filtrlarga aylantiruvchi yordamchisan.",
    'Faqat quyidagi maydonlarni ishlatgan JSON qaytar (boshqa hech narsa, izohsiz):',
    '- deal: "SALE" (sotuv) yoki "RENT" (ijara). "ijara/arenda" bo\'lsa RENT, aks holda SALE.',
    '- type: "NEW_BUILD" (yangi qurilish), "SECONDARY" (ikkilamchi), "HOUSE" (uy/hovli), "COMMERCIAL" (tijorat). Noaniq bo\'lsa tashla.',
    '- rooms: butun son (5 = "5 va undan ko\'p").',
    '- priceMin, priceMax: SO\'MDA butun son. "ming"=1000, "mln"/"million"=1000000. "gacha"=priceMax, "dan"=priceMin.',
    '- areaMin, areaMax: m² butun son.',
    '- sort: "CHEAP" (arzon), "EXPENSIVE" (qimmat), "NEW" (yangi).',
    '- search: tuman, mo\'ljal, majmua nomi va boshqa erkin kalit so\'zlar (masalan "Yunusobod", "metro").',
    "Noaniq maydonni tashla — o'ylab topma. Faqat JSON qaytar.",
    `So'rov: ${query}`,
  ].join('\n');
}

function clampRanges(c: AiSearchCriteria): AiSearchCriteria {
  const out = { ...c };
  if (out.priceMin != null && out.priceMax != null && out.priceMin > out.priceMax) {
    [out.priceMin, out.priceMax] = [out.priceMax, out.priceMin];
  }
  if (out.areaMin != null && out.areaMax != null && out.areaMin > out.areaMax) {
    [out.areaMin, out.areaMax] = [out.areaMax, out.areaMin];
  }
  return out;
}

function hasAnyField(c: AiSearchCriteria): boolean {
  return Object.values(c).some((v) => v !== undefined && v !== null && v !== '');
}

// Record<ListingType, string> (finite keys) — NOT Record<string,string>, whose index access is
// `string | undefined` under noUncheckedIndexedAccess and fails to narrow inside push().
const TYPE_LABELS: Record<ListingType, string> = {
  NEW_BUILD: 'Yangi qurilish',
  SECONDARY: 'Ikkilamchi',
  HOUSE: 'Uy',
  COMMERCIAL: 'Tijorat',
};

// Thousand grouping without Intl/ICU (Node ICU availability is not assumed): 500000000 -> "500 000 000".
const groupNum = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** One-line Uzbek readout of EVERY parsed field, so the buyer sees exactly what the AI understood
 *  (R2/§1 transparency) even where the filter panel input cannot show it. */
function buildSummary(c: AiSearchCriteria): string {
  const parts: string[] = [];
  if (c.deal) parts.push(c.deal === 'RENT' ? 'Ijara' : 'Sotuv');
  if (c.type) parts.push(TYPE_LABELS[c.type]); // c.type: ListingType here -> string, no undefined
  if (c.rooms != null) parts.push(c.rooms >= 5 ? '5+ xona' : `${c.rooms} xona`);
  if (c.priceMin != null || c.priceMax != null) {
    const lo = c.priceMin != null ? groupNum(c.priceMin) : '';
    const hi = c.priceMax != null ? groupNum(c.priceMax) : '';
    parts.push(lo && hi ? `${lo}–${hi} so'm` : hi ? `${hi} so'mgacha` : `${lo} so'mdan`);
  }
  if (c.areaMin != null || c.areaMax != null) {
    const lo = c.areaMin != null ? String(c.areaMin) : '';
    const hi = c.areaMax != null ? String(c.areaMax) : '';
    parts.push(lo && hi ? `${lo}–${hi} m²` : hi ? `${hi} m² gacha` : `${lo} m² dan`);
  }
  if (c.sort === 'CHEAP') parts.push('avval arzon');
  else if (c.sort === 'EXPENSIVE') parts.push('avval qimmat');
  if (c.search) parts.push(c.search);
  return parts.join(' · ');
}

/** Turn the raw model text (or null) into a validated, clamped response. NEVER throws.
 *  raw==null / not JSON / no valid field → fallback (plain keyword search on the raw query). */
export function buildSearchResponse(raw: string | null, query: string): AiSearchResponse {
  const fallback: AiSearchResponse = { fallback: true, criteria: { search: query }, summary: '' };
  if (raw == null) return fallback;
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return fallback;
  }
  const result = AiSearchCriteriaSchema.safeParse(parsed);
  if (!result.success || !hasAnyField(result.data)) return fallback;
  const criteria = clampRanges(result.data);
  return { fallback: false, criteria, summary: buildSummary(criteria) };
}
