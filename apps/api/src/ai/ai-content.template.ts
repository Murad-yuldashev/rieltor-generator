import type { AiContentRequest, ListingType } from '@rieltor/shared';

// Thousand grouping without Intl/ICU (the 7.2a lesson). priceSom is a validated digit string.
const groupSom = (n: string): string => n.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Record<ListingType, string> — finite keys, so index access is `string` (no undefined) under
// noUncheckedIndexedAccess (the 7.2a lesson).
const TYPE_WORD: Record<ListingType, string> = {
  NEW_BUILD: 'yangi qurilish',
  SECONDARY: 'ikkilamchi bozor',
  HOUSE: 'hovli',
  COMMERCIAL: 'tijorat obyekti',
};
const TYPE_TAG: Record<ListingType, string> = {
  NEW_BUILD: '#yangiqurilish',
  SECONDARY: '#ikkilamchibozor',
  HOUSE: '#hovli',
  COMMERCIAL: '#tijorat',
};

const districtTag = (d: string): string => '#' + d.toLowerCase().replace(/\s+/g, '');

/** A ready-to-post Uzbek caption + hashtags from the listing fields (every field null-guarded). */
export function buildContentTemplate(f: AiContentRequest): { caption: string; hashtags: string } {
  const dealWord = f.deal === 'RENT' ? 'Ijaraga' : 'Sotuvga';
  const roomsPart = f.rooms != null ? `${f.rooms} xonali ` : '';
  const priceSuffix = f.deal === 'RENT' ? " so'm/oy" : " so'm";
  // NOTE: ListingSummary.district is already the FULL form ending in " tumani"
  // (e.g. "Chilonzor tumani" — TASHKENT_DISTRICTS + seed). Do NOT append " tumani"
  // (that would render "Chilonzor tumani tumani"); interpolate the district as-is.
  const caption =
    `🏠 ${dealWord}: ${roomsPart}${TYPE_WORD[f.type]}, ${f.district}.\n` +
    `📐 ${f.areaM2} m² · 💰 ${groupSom(f.priceSom)}${priceSuffix}\n` +
    `📞 Batafsil ma'lumot va ko'rsatuv uchun yozing!`;
  const hashtags = [
    '#toshkent',
    '#korchmasmulk',
    f.deal === 'RENT' ? '#ijara' : '#sotuv',
    TYPE_TAG[f.type],
    districtTag(f.district),
  ].join(' ');
  return { caption, hashtags };
}
