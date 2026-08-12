import { createHash } from 'node:crypto';

/**
 * `ipHash = sha256(ip + ':' + UTC-date + ':' + secret)` (spec §8.2). The UTC date
 * folds into the salt so a hash computed today cannot be correlated with the same
 * IP's hash tomorrow. `secret` is optional — IP_HASH_SECRET may be unset, and this
 * still produces a (weaker) hash rather than throwing, matching the project's rule
 * that a missing optional env degrades a feature instead of crashing it.
 */
export function hashIp(ip: string, secret: string | undefined, now: Date = new Date()): string {
  const utcDate = now.toISOString().slice(0, 10);
  return createHash('sha256')
    .update(`${ip}:${utcDate}:${secret ?? ''}`)
    .digest('hex');
}
