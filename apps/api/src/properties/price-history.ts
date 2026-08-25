import { MODELED_MONTHLY_GROWTH } from '@rieltor/shared';

export interface ModeledPoint {
  estimateSom: bigint;
  capturedAt: Date;
}

/** Deterministic jitter in [-0.004, +0.004] from (id, monthsAgo) — same curve every render, no Math.random. */
function jitter(id: string, monthsAgo: number): number {
  const seed = `${id}:${monthsAgo}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.008;
}

/**
 * 12 monthly MODELED snapshots walking back from today, oldest first:
 * value(monthsAgo) = today / (1 + g)^monthsAgo, nudged by a deterministic jitter.
 * Used to seed a full chart on day one; real ACTUAL snapshots replace the tail over time.
 */
export function modeledHistory(id: string, todayEstimate: bigint, today: Date): ModeledPoint[] {
  const todayNum = Number(todayEstimate);
  const points: ModeledPoint[] = [];
  for (let monthsAgo = 12; monthsAgo >= 1; monthsAgo--) {
    const base = todayNum / (1 + MODELED_MONTHLY_GROWTH) ** monthsAgo;
    const value = Math.max(0, Math.round(base * (1 + jitter(id, monthsAgo))));
    const capturedAt = new Date(today);
    capturedAt.setMonth(capturedAt.getMonth() - monthsAgo);
    points.push({ estimateSom: BigInt(value), capturedAt });
  }
  return points;
}
