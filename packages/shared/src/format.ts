/** Groups a digit string in threes with a plain space: "480000000" → "480 000 000" */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** priceSom is always a string — a BigInt value may not fit in a number. */
export function formatPriceSom(priceSom: string): string {
  return `${groupDigits(priceSom)} so'm`;
}

export function formatPriceUsd(priceUsd: number): string {
  return `$${groupDigits(String(priceUsd))}`;
}

/**
 * Price per square metre — "11,9 mln/m²".
 * Even though priceSom is a string, the value stays below 2^53 (the priciest
 * house is ~2.1 bn), so Number precision is sufficient here.
 */
export function formatPricePerM2(priceSom: string, areaM2: number): string {
  const mln = Number(priceSom) / areaM2 / 1_000_000;
  return `${mln.toFixed(1).replace('.', ',')} mln/m²`;
}

const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const;

/** "2026-07-26" → "26-iyul". An unexpected format is returned unchanged. */
export function formatListedAt(listedAt: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(listedAt);
  if (!m) return listedAt;
  return `${Number(m[3])}-${MONTHS[Number(m[2]) - 1]}`;
}
