const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * "listedAt" is an ISO date ("2026-07-26"). The desktop result row's footer
 * wants how long ago that was, not the absolute date — "3 kun oldin" reads as
 * fresher than "26-iyul" and is what pushes a browsing user to click through.
 * `now` is injectable so a caller can pin it; callers that don't pass it get
 * the real clock.
 */
export function relativeFreshness(listedAt: string, now: Date = new Date()): string {
  const listed = new Date(`${listedAt}T00:00:00`);
  const days = Math.floor((now.getTime() - listed.getTime()) / DAY_MS);

  if (days <= 0) return 'Bugun';
  if (days === 1) return 'Kecha';
  if (days < 7) return `${days} kun oldin`;
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`;
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`;
  return `${Math.floor(days / 365)} yil oldin`;
}
