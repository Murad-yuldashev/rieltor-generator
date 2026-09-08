export interface MortgageInput {
  priceSom: number;
  downSom: number;
  annualRateBps: number;
  termMonths: number;
}
export interface MortgageResult {
  principalSom: number;
  monthlySom: number;
  totalSom: number;
  overpaymentSom: number;
}

/** Annuity monthly payment. r=0 → straight division (no divide-by-zero). Estimate, rounded to som. */
export function computeMortgage({
  priceSom,
  downSom,
  annualRateBps,
  termMonths,
}: MortgageInput): MortgageResult {
  const principal = Math.max(0, priceSom - downSom);
  const r = annualRateBps / 10000 / 12; // monthly rate as a decimal
  const n = Math.max(1, Math.floor(termMonths));
  const monthly = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const monthlySom = Math.round(monthly);
  const totalSom = monthlySom * n;
  return {
    principalSom: principal,
    monthlySom,
    totalSom,
    overpaymentSom: Math.max(0, totalSom - principal),
  };
}
