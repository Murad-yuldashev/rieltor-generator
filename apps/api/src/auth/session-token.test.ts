import { describe, expect, it } from 'vitest';
import { SESSION_TTL_SEC, signSession, verifySession } from './session-token';

const SECRET = 'test-session-secret';
const NOW = 1_754_700_000;

describe('session token', () => {
  it('round-trips the realtor id', () => {
    const token = signSession('rlt_1', SECRET, NOW);
    expect(verifySession(token, SECRET, NOW + 10)).toBe('rlt_1');
  });

  it('rejects a token signed with another secret', () => {
    const token = signSession('rlt_1', SECRET, NOW);
    expect(verifySession(token, 'boshqa-sir', NOW + 10)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = signSession('rlt_1', SECRET, NOW);
    const [, signature] = token.split('.');
    const forged = `${Buffer.from(JSON.stringify({ sub: 'rlt_2', exp: NOW + 100 })).toString(
      'base64url',
    )}.${signature}`;
    expect(verifySession(forged, SECRET, NOW + 10)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signSession('rlt_1', SECRET, NOW, 60);
    expect(verifySession(token, SECRET, NOW + 61)).toBeNull();
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'shunchaki-matn', 'a.b.c', 'a.']) {
      expect(verifySession(bad, SECRET, NOW)).toBeNull();
    }
  });

  it('defaults to a thirty-day lifetime', () => {
    expect(SESSION_TTL_SEC).toBe(30 * 24 * 60 * 60);
  });
});
