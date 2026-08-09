import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE, clearedSessionCookie, readCookie, serializeSessionCookie } from './cookie';

describe('serializeSessionCookie', () => {
  it('sets the security flags', () => {
    const header = serializeSessionCookie('abc.def', 3600, true);
    expect(header).toBe(
      `${SESSION_COOKIE}=abc.def; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600`,
    );
  });

  it('leaves Secure out over plain http, or the browser would drop the cookie', () => {
    expect(serializeSessionCookie('abc.def', 3600, false)).not.toContain('Secure');
  });
});

describe('clearedSessionCookie', () => {
  it('expires the cookie immediately', () => {
    expect(clearedSessionCookie(false)).toContain('Max-Age=0');
  });
});

describe('readCookie', () => {
  it('finds a value among several cookies', () => {
    expect(readCookie(`theme=dark; ${SESSION_COOKIE}=abc.def; lang=uz`, SESSION_COOKIE)).toBe(
      'abc.def',
    );
  });

  it('returns null when the header is missing or the name is absent', () => {
    expect(readCookie(undefined, SESSION_COOKIE)).toBeNull();
    expect(readCookie('theme=dark', SESSION_COOKIE)).toBeNull();
  });

  it('does not match a cookie whose name merely ends with the wanted one', () => {
    expect(readCookie(`other_${SESSION_COOKIE}=abc`, SESSION_COOKIE)).toBeNull();
  });
});
