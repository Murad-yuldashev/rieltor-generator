import type { DebtorRow, FinanceInsightResponse, FinanceSummary } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';

const MAX_INSIGHT = 1200;

/** Uzbek instruction: narrate ONLY these authoritative numbers, plain text, no invented figures.
 *  PII-minimized — at most the top debtor's name + amount, never a phone (R6). */
export function buildInsightPrompt(summary: FinanceSummary, debtors: DebtorRow[]): string {
  const facts = [
    `Kontraktlangan: ${formatPriceSom(summary.contractedSom, 'SALE')}`,
    `Yig'ilgan: ${formatPriceSom(summary.collectedSom, 'SALE')}`,
    `Qoldiq: ${formatPriceSom(summary.outstandingSom, 'SALE')}`,
    `Muddati o'tgan: ${formatPriceSom(summary.overdueSom, 'SALE')}`,
    `Net komissiya: ${formatPriceSom(summary.commissionPaidSom, 'SALE')}`,
    `Balans: ${formatPriceSom(summary.orgBalanceSom, 'SALE')}`,
    `Qarzdorlar soni: ${summary.debtorCount}`,
  ];
  const top = debtors[0];
  if (top) {
    facts.push(`Eng katta qarzdor: ${top.buyerName}, ${formatPriceSom(top.overdueSom, 'SALE')}`);
  }
  return [
    'Sen quruvchi tashkilot uchun moliyaviy tahlilchi yordamchisan.',
    `Moliyaviy ko'rsatkichlar: ${facts.join('; ')}.`,
    "Faqat shu raqamlardan foydalan, yangi raqam o'ylab topma.",
    "Qisqa (2-4 gap) o'zbekcha tahlil yoz va oxirida bitta amaliy tavsiya ber.",
    'Faqat oddiy matn qaytar (JSON emas, sarlavhasiz).',
  ].join('\n');
}

/** Turn the raw model text (or null) into a validated response. NEVER throws.
 *  null / empty → the template with ai:false; otherwise code fences stripped, trimmed, length-capped. */
export function parseInsight(raw: string | null, template: string): FinanceInsightResponse {
  if (raw == null) return { ai: false, insight: template };
  const cleaned = raw
    .replace(/^```(?:\w+)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  if (cleaned === '') return { ai: false, insight: template };
  return { ai: true, insight: cleaned.slice(0, MAX_INSIGHT) };
}
