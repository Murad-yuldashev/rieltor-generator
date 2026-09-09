import type { Deal, LeadOutcomeStage, ListingType } from '@rieltor/shared';

/** The lead fields the assistant reads (the Prisma select in the service). */
export interface LeadFacts {
  deal: Deal;
  type: ListingType | null;
  district: string | null;
  roomsMin: number | null;
  priceMaxSom: bigint | null;
  areaMinM2: number | null;
  note: string | null;
  outcomeStage: LeadOutcomeStage;
}

// Thousand grouping without Intl/ICU (the 7.2a lesson): 500000000n -> "500 000 000".
const groupSom = (n: bigint): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Record<LeadOutcomeStage, string> — finite keys, so index access is `string` (no undefined) under
// noUncheckedIndexedAccess (the 7.2a lesson).
const NEXT_ACTION: Record<LeadOutcomeStage, string> = {
  NEW: "Xaridorga qo'ng'iroq qilib, byudjet va afzalliklarni aniqlang, so'ng mos variantlarni yuboring.",
  CONTACTED: "Mos variantlar tanlab, ko'rsatuvga (namoyishga) taklif qiling.",
  MEETING: "Ko'rsatuvdan so'ng shartlarni kelishing va rasmiy taklif yuboring.",
  WON: "Bitim yopildi — hujjatlarni yakunlang va mijozdan sharh so'rang.",
  LOST: 'Sababni tahlil qiling; keyinchalik mos variant chiqsa, mijozga qayta murojaat qiling.',
};

const TYPE_WORD: Record<ListingType, string> = {
  NEW_BUILD: 'yangi qurilish',
  SECONDARY: 'ikkilamchi',
  HOUSE: 'hovli',
  COMMERCIAL: 'tijorat obyekti',
};

/** A polite Uzbek first-outreach draft filled from the structured fields (every field null-guarded).
 *  No buyer name (privacy-safe; the realtor personalizes). */
export function templateMessage(lead: LeadFacts): string {
  const dealWord = lead.deal === 'RENT' ? 'ijaraga' : 'sotib olishga';
  const parts: string[] = [];
  if (lead.roomsMin != null) parts.push(`${lead.roomsMin} xonali`);
  if (lead.type) parts.push(TYPE_WORD[lead.type]);
  if (lead.district) parts.push(`${lead.district} tumanida`);
  const what = parts.length ? parts.join(' ') : "ko'chmas mulk";
  const budget =
    lead.priceMaxSom != null ? ` (byudjet ${groupSom(lead.priceMaxSom)} so'mgacha)` : '';
  return (
    `Assalomu alaykum! Siz ${dealWord} ${what}${budget} qidirayotgan ekansiz. ` +
    `Men rieltor — sizga mos variantlarni topishga yordam beraman. ` +
    `Qulay vaqtda gaplashsak bo'ladimi?`
  );
}

export function buildAssistTemplate(lead: LeadFacts): { nextAction: string; message: string } {
  return { nextAction: NEXT_ACTION[lead.outcomeStage], message: templateMessage(lead) };
}
