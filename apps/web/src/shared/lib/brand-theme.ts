import type { CSSProperties } from 'react';

function shade(hex: string, target: 0 | 255, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${ch.join('')}`;
}

/** Override the accent CSS custom properties from a realtor's brand hex; undefined
 *  (no hex) leaves the platform default in place. Every bg-accent/text-accent/
 *  border-accent descendant rebrands with no per-component edit. */
export function brandThemeVars(hex: string | null): CSSProperties | undefined {
  if (!hex) return undefined;
  return {
    '--color-accent': hex,
    '--color-accent-dark': shade(hex, 0, 0.18),
    '--color-accent-soft': shade(hex, 255, 0.9),
    '--brand': hex,
  } as CSSProperties;
}
