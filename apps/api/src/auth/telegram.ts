import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { TelegramAuth } from '@rieltor/shared';

/** Telegram's own recommendation: treat anything older than a day as stale. */
export const TELEGRAM_AUTH_MAX_AGE_SEC = 24 * 60 * 60;

/** Clocks drift; a minute of tolerance avoids rejecting a fresh login. */
const FUTURE_TOLERANCE_SEC = 60;

/**
 * The string Telegram signs: every field except `hash`, as `key=value`, sorted
 * alphabetically and joined with newlines. Fields the widget omitted are left out —
 * including them as "undefined" would change the signature.
 */
export function telegramDataCheckString(payload: TelegramAuth): string {
  const { hash: _hash, ...rest } = payload;

  return Object.entries(rest)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');
}

export function verifyTelegramAuth(
  payload: TelegramAuth,
  botToken: string,
  nowSec: number,
): boolean {
  const age = nowSec - payload.auth_date;
  if (age > TELEGRAM_AUTH_MAX_AGE_SEC || age < -FUTURE_TOLERANCE_SEC) return false;

  const secret = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(telegramDataCheckString(payload)).digest();
  const received = Buffer.from(payload.hash, 'hex');

  // timingSafeEqual throws on a length mismatch, so the guard has to come first.
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}
