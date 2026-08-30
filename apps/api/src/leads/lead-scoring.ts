export type LeadScoreInput = {
  district: string | null;
  type: string | null;
  roomsMin: number | null;
  areaMinM2: number | null;
  note: string | null;
  priceMaxSom: bigint | null;
  createdAt: Date;
};

const BUDGET_STEP = 50_000_000n; // 50 mln so'm per point; ~1.5 bln hits the 30 cap
const RECENCY_MAX = 20;
const MS_PER_DAY = 86_400_000;

/** Deterministic 0..100 lead quality score. */
export function computeLeadScore(input: LeadScoreInput, now: Date = input.createdAt): number {
  // Completeness: +10 per present optional signal (max 50).
  const completeness =
    (input.district ? 10 : 0) +
    (input.type ? 10 : 0) +
    (input.roomsMin != null ? 10 : 0) +
    (input.areaMinM2 != null ? 10 : 0) +
    (input.note && input.note.trim() ? 10 : 0);

  // Budget: priceMaxSom / BUDGET_STEP, capped at 30.
  const budget =
    input.priceMaxSom != null && input.priceMaxSom > 0n
      ? Math.min(30, Number(input.priceMaxSom / BUDGET_STEP))
      : 0;

  // Recency: full when fresh, -1/day, floor 0.
  const days = Math.max(0, Math.floor((now.getTime() - input.createdAt.getTime()) / MS_PER_DAY));
  const recency = Math.max(0, RECENCY_MAX - days);

  return Math.max(0, Math.min(100, completeness + budget + recency));
}

/** Score → the price (so'm) a realtor pays to claim (charged in 4.2). */
export function priceForScore(score: number): bigint {
  if (score < 40) return 20_000n;
  if (score <= 70) return 35_000n;
  return 50_000n;
}
