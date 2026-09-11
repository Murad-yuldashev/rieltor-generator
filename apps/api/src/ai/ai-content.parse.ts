import { z } from 'zod';
import type { AiContentRequest, AiContentResponse } from '@rieltor/shared';

const ModelOutputSchema = z.object({
  caption: z.string().trim().min(1).max(1500),
  hashtags: z.string().trim().min(1).max(400),
});

const DEAL_WORD = { SALE: 'sotuv', RENT: 'ijara' } as const;

/** Uzbek instruction telling Gemini to return ONLY {caption, hashtags} JSON. The server never
 *  relies on the model obeying — it validates (parseContent). */
export function buildContentPrompt(f: AiContentRequest): string {
  const facts = [
    `bitim: ${DEAL_WORD[f.deal]}`,
    `tur: ${f.type}`,
    `tuman: ${f.district}`,
    f.rooms != null ? `xonalar: ${f.rooms}` : null,
    `maydon (m²): ${f.areaM2}`,
    `narx (so'm${f.deal === 'RENT' ? '/oy' : ''}): ${f.priceSom}`,
  ]
    .filter(Boolean)
    .join(', ');
  return [
    "Sen O'zbekistonda ko'chmas mulk e'loni uchun ijtimoiy tarmoq (Instagram/Telegram) posti yozadigan yordamchisan.",
    `E'lon ma'lumoti: ${facts}.`,
    'Faqat quyidagi JSON qaytar (boshqa hech narsa, izohsiz):',
    '{"caption": "...", "hashtags": "..."}',
    "- caption: qisqa, jozibali o'zbekcha post (2-4 gap, emoji bo'lishi mumkin), oxirida murojaatga chaqiruv.",
    "- hashtags: 4-8 ta tegishli o'zbekcha/shahar hashtag, bo'sh joy bilan ajratilgan bitta satr.",
  ].join('\n');
}

/** Turn the raw model text (or null) into a validated response. NEVER throws.
 *  null / not JSON / invalid -> the template with ai:false. */
export function parseContent(
  raw: string | null,
  template: { caption: string; hashtags: string },
): AiContentResponse {
  const fallback: AiContentResponse = { ai: false, ...template };
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
  return { ai: true, caption: result.data.caption, hashtags: result.data.hashtags };
}
