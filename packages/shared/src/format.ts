/** Raqamli satrni uch xonadan oddiy probel bilan ajratadi: "480000000" → "480 000 000" */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** priceSom har doim string — BigInt qiymati number'ga sig'masligi mumkin. */
export function formatPriceSom(priceSom: string): string {
  return `${groupDigits(priceSom)} so'm`;
}

export function formatPriceUsd(priceUsd: number): string {
  return `$${groupDigits(String(priceUsd))}`;
}
