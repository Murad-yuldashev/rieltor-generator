/**
 * Coerce a raw phone string to the Uzbek canonical form `998XXXXXXXXX` (12 digits).
 * Strips every non-digit first, then normalizes the common local formats:
 *   - 12 digits already starting `998` → kept as-is
 *   - 9 digits (a bare subscriber number) → prefixed with `998`
 *   - 10 digits starting `0` (a national-trunk form) → drop the `0`, prefix `998`
 *   - anything else → the stripped digits, unchanged (best effort, no match)
 * Used to compare buyer phones across CRMs when fixating a lead onto a unit.
 */
export function canonicalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('998')) return digits;
  if (digits.length === 9) return `998${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `998${digits.slice(1)}`;
  return digits;
}
