import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

/** Minimal ConfigService stand-in: the controller only ever calls get(). */
function fakeConfig(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as never;
}

function fakeResponse(): Response {
  return { setHeader: vi.fn() } as unknown as Response;
}

describe('AuthController cookie security derivation', () => {
  it('marks the cookie Secure when PUBLIC_BASE_URL is https', () => {
    const controller = new AuthController(
      {} as never,
      {} as never,
      fakeConfig({ PUBLIC_BASE_URL: 'https://rieltor.uz' }),
    );
    const res = fakeResponse();

    controller.logout(res);

    expect(res.setHeader).toHaveBeenCalledWith('set-cookie', expect.stringContaining('Secure'));
  });

  it('leaves the cookie insecure when PUBLIC_BASE_URL is plain http, as it is in local dev', () => {
    const controller = new AuthController(
      {} as never,
      {} as never,
      fakeConfig({ PUBLIC_BASE_URL: 'http://localhost:3000' }),
    );
    const res = fakeResponse();

    controller.logout(res);

    expect(res.setHeader).toHaveBeenCalledWith('set-cookie', expect.not.stringContaining('Secure'));
  });
});
