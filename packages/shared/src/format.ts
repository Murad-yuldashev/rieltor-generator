/** Raqamli satrni uch xonadan oddiy probel bilan ajratadi: "480000000" → "480 000 000" */
function guruhla(raqam: string): string {
  return raqam.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** narxSom har doim string — BigInt qiymati number'ga sig'masligi mumkin. */
export function formatNarxSom(narxSom: string): string {
  return `${guruhla(narxSom)} so'm`;
}

export function formatNarxUsd(narxUsd: number): string {
  return `$${guruhla(String(narxUsd))}`;
}
