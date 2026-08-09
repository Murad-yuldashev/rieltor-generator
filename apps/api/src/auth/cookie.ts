export const SESSION_COOKIE = 'rlt_session';

/**
 * SameSite=Lax is the CSRF guard: the browser will not attach this cookie to a
 * cross-site POST, and every state-changing endpoint here is POST or PATCH.
 */
function serialize(value: string, maxAgeSec: number, secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  parts.push(`Max-Age=${maxAgeSec}`);

  return parts.join('; ');
}

export function serializeSessionCookie(token: string, maxAgeSec: number, secure: boolean): string {
  return serialize(token, maxAgeSec, secure);
}

export function clearedSessionCookie(secure: boolean): string {
  return serialize('', 0, secure);
}

/** No cookie-parser in this app — one header, parsed where it is needed. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim();
  }

  return null;
}
