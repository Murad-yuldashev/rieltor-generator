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

export type BudgetTier = 'NONE' | 'LOW' | 'MID' | 'HIGH';

const LOW_MAX = 300_000_000n; // ≤300 mln so'm
const MID_MAX = 800_000_000n; // ≤800 mln so'm

/** Coarse budget bucket for lead-conversion segmentation (null budget is its own bucket). */
export function budgetTier(priceMaxSom: bigint | null): BudgetTier {
  if (priceMaxSom == null) return 'NONE';
  if (priceMaxSom <= LOW_MAX) return 'LOW';
  if (priceMaxSom <= MID_MAX) return 'MID';
  return 'HIGH';
}

/** A Prisma `priceMaxSom` filter matching the tier's range (null = IS NULL). */
export function budgetTierPriceWhere(tier: BudgetTier): null | { gt?: bigint; lte?: bigint } {
  switch (tier) {
    case 'NONE':
      return null; // priceMaxSom: null  ->  IS NULL
    case 'LOW':
      return { lte: LOW_MAX };
    case 'MID':
      return { gt: LOW_MAX, lte: MID_MAX };
    case 'HIGH':
      return { gt: MID_MAX };
  }
}

/** WON / (WON + LOST); null when nothing is resolved yet. */
export function winRate(won: number, lost: number): number | null {
  const resolved = won + lost;
  return resolved === 0 ? null : won / resolved;
}

const PRIOR_STRENGTH = 10; // alpha — the global rate is worth this many prior observations
const ADJ_MAX = 15; // adjustment bounded to +/- this
const ADJ_GAIN = 40; // maps a (rate - global) gap to score points

/**
 * Confidence-weighted score adjustment from a segment's resolved outcomes.
 * With few/no resolved leads, rHat -> globalRate, so the adjustment -> 0 (pure base).
 */
export function conversionAdjustment(won: number, lost: number, globalRate: number): number {
  const resolved = won + lost;
  if (resolved === 0) return 0;
  const rHat = (won + PRIOR_STRENGTH * globalRate) / (resolved + PRIOR_STRENGTH);
  const raw = Math.round(ADJ_GAIN * (rHat - globalRate));
  return Math.max(-ADJ_MAX, Math.min(ADJ_MAX, raw));
}
