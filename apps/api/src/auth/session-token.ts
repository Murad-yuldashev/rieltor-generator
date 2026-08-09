import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_TTL_SEC = 30 * 24 * 60 * 60;

interface SessionPayload {
  /** Realtor id. */
  sub: string;
  /** Unix seconds. */
  exp: number;
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

/** `<base64url(payload)>.<base64url(hmac)>` — a JWT without the unused header. */
export function signSession(
  realtorId: string,
  secret: string,
  nowSec: number,
  ttlSec: number = SESSION_TTL_SEC,
): string {
  const payload: SessionPayload = { sub: realtorId, exp: nowSec + ttlSec };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${body}.${sign(body, secret)}`;
}

/** Returns the realtor id, or null for anything that does not verify. */
export function verifySession(token: string, secret: string, nowSec: number): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const received = Buffer.from(signature);
  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp <= nowSec) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
