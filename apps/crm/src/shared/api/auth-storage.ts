import type { AuthTokens } from '@rieltor/shared';

const KEY = 'rieltor.auth';

type Stored = Pick<AuthTokens, 'accessToken' | 'refreshToken'>;

export function readTokens(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    // Private mode, disabled storage, or corrupted JSON — treat as logged out.
    return null;
  }
}

export function writeTokens(tokens: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tokens));
  } catch {
    // Nothing to do: the session simply will not survive a reload.
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
