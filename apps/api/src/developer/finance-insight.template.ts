import type { DebtorRow, FinanceSummary } from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';

/**
 * A plain-Uzbek narration over the org finance snapshot — ALWAYS computable from the aggregates
 * (the hybrid fallback: no key / an unusable model response returns this). Money via the shared
 * formatPriceSom (ICU-free grouping, identical to the Moliya cards). Every field guarded.
 */
export function buildInsightTemplate(summary: FinanceSummary, debtors: DebtorRow[]): string {
  const pct = collectionPct(summary.contractedSom, summary.collectedSom);
  const isDebt = summary.orgBalanceSom.startsWith('-');

  const lines: string[] = [
    `Tashkilotingiz ${formatPriceSom(summary.contractedSom, 'SALE')} shartnoma qildi, ` +
      `${formatPriceSom(summary.collectedSom, 'SALE')} yig'ildi (${pct}%).`,
    `Qoldiq ${formatPriceSom(summary.outstandingSom, 'SALE')}, ` +
      `muddati o'tgan ${formatPriceSom(summary.overdueSom, 'SALE')}.`,
    `Net komissiya ${formatPriceSom(summary.commissionPaidSom, 'SALE')}, ` +
      `balans ${formatPriceSom(summary.orgBalanceSom, 'SALE')}${isDebt ? ' (qarz)' : ''}.`,
  ];

  const top = debtors.length
    ? debtors.reduce((max, d) => (BigInt(d.overdueSom) > BigInt(max.overdueSom) ? d : max))
    : undefined;
  if (top) {
    lines.push(
      `${summary.debtorCount} ta qarzdor bor; eng kattasi ${top.buyerName} — ` +
        `${formatPriceSom(top.overdueSom, 'SALE')}.`,
      "Tavsiya: muddati o'tgan to'lovlar bo'yicha xaridorlar bilan bog'laning.",
    );
  } else {
    lines.push(
      "Muddati o'tgan qarzdor yo'q — to'lovlar jadval bo'yicha bormoqda.",
      "Tavsiya: joriy sur'atni saqlang va yangi shartnomalarga e'tibor qarating.",
    );
  }
  return lines.join(' ');
}

/**
 * Collection percentage as an integer — BigInt-safe (operands can exceed 2^53) and
 * divide-by-zero-guarded (no contracted → 0%). The ratio always fits in a number.
 */
function collectionPct(contractedSom: string, collectedSom: string): number {
  const contracted = BigInt(contractedSom);
  if (contracted === 0n) return 0;
  return Number((BigInt(collectedSom) * 100n) / contracted);
}
