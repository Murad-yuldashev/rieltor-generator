import { z } from 'zod';
import type { LeadAssistResponse } from '@rieltor/shared';
import type { LeadFacts } from './lead-assist.template';

const ModelOutputSchema = z.object({
  nextAction: z.string().trim().min(1).max(600),
  message: z.string().trim().min(1).max(1200),
});

const DEAL_WORD = { SALE: 'sotib olish', RENT: 'ijara' } as const;

/** Uzbek instruction telling Gemini to return ONLY {nextAction, message} JSON. The server never
 *  relies on the model obeying — it validates (parseAssist). */
export function buildAssistPrompt(lead: LeadFacts): string {
  const facts = [
    `bitim: ${DEAL_WORD[lead.deal]}`,
    lead.type ? `tur: ${lead.type}` : null,
    lead.district ? `tuman: ${lead.district}` : null,
    lead.roomsMin != null ? `xonalar (kamida): ${lead.roomsMin}` : null,
    lead.priceMaxSom != null ? `byudjet (gacha, so'm): ${lead.priceMaxSom}` : null,
    lead.areaMinM2 != null ? `maydon (kamida, m²): ${lead.areaMinM2}` : null,
    lead.note ? `mijoz izohi: ${lead.note}` : null,
    `bosqich: ${lead.outcomeStage}`,
  ]
    .filter(Boolean)
    .join(', ');
  return [
    "Sen O'zbekistonda rieltorga olingan lead bilan ishlashda yordam beruvchi yordamchisan.",
    `Lead ma'lumoti: ${facts}.`,
    'Faqat quyidagi JSON qaytar (boshqa hech narsa, izohsiz):',
    '{"nextAction": "...", "message": "..."}',
    '- nextAction: rieltor uchun qisqa (1 gap) keyingi qadam tavsiyasi, bosqichga mos.',
    "- message: mijozga birinchi murojaat uchun qisqa, xushmuomala o'zbekcha xabar (2-3 gap). Mijoz ismini ishlatma.",
  ].join('\n');
}

/** Turn the raw model text (or null) into a validated response. NEVER throws.
 *  null / not JSON / invalid → the template with ai:false. */
export function parseAssist(
  raw: string | null,
  template: { nextAction: string; message: string },
): LeadAssistResponse {
  const fallback: LeadAssistResponse = { ai: false, ...template };
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
  const result = ModelOutputSchema.safeParse(parsed);
  if (!result.success) return fallback;
  return { ai: true, nextAction: result.data.nextAction, message: result.data.message };
}
