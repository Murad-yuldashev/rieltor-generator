const UNITS: Record<string, number> = { mln: 1e6, mlrd: 1e9 };

/**
 * Parses the price fields: "500 mln", "1,5 mlrd" or a raw "500000000".
 * The mockup's placeholder uses the unit form, so values typed that way are
 * understood too. Anything unparseable yields null (no filter applied).
 */
export function parsePriceInput(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  const match = /^([\d\s.,]+?)\s*(mln|mlrd)?$/.exec(text);
  if (!match?.[1]) return null;

  // "1 500 000" → 1500000, "1,5" → 1.5
  const value = Number(match[1].replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;

  return Math.round(value * (UNITS[match[2] ?? ''] ?? 1));
}

/** Plain non-negative number input (area fields). */
export function parseNumberInput(raw: string): number | null {
  const value = Number(raw.trim().replace(/\s/g, '').replace(',', '.'));
  return raw.trim() && Number.isFinite(value) && value >= 0 ? value : null;
}
