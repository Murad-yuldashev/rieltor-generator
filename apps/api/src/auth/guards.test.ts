import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AdminGuard } from './admin.guard';
import { RealtorGuard } from './realtor.guard';
import { SESSION_COOKIE } from './cookie';
import { signSession } from './session-token';

const SECRET = 'guard-test-secret-16+';

/** DEMO_MODE is off in every RealtorGuard case here, so the guard never touches Prisma. */
const fakePrisma = {} as never;

/** Only the two properties the guards read — not a full express Request. */
interface FakeRequest {
  headers: Record<string, string>;
  realtorId?: string;
}

/** Minimal ConfigService stand-in: the guards only ever call get(). */
function fakeConfig(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as never;
}

function contextFor(request: FakeRequest) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RealtorGuard', () => {
  it('accepts a valid session cookie and exposes the realtor id', async () => {
    const token = signSession('rlt_1', SECRET, Math.floor(Date.now() / 1000));
    const request: FakeRequest = { headers: { cookie: `${SESSION_COOKIE}=${token}` } };
    const guard = new RealtorGuard(fakeConfig({ JWT_SECRET: SECRET }), fakePrisma);

    expect(await guard.canActivate(contextFor(request))).toBe(true);
    expect(request.realtorId).toBe('rlt_1');
  });

  it('rejects a request without a cookie', async () => {
    const guard = new RealtorGuard(fakeConfig({ JWT_SECRET: SECRET }), fakePrisma);
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a cookie signed with another secret', async () => {
    const token = signSession('rlt_1', 'boshqa-sir-16-belgidan', Math.floor(Date.now() / 1000));
    const guard = new RealtorGuard(fakeConfig({ JWT_SECRET: SECRET }), fakePrisma);

    await expect(
      guard.canActivate(contextFor({ headers: { cookie: `${SESSION_COOKIE}=${token}` } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('answers 503 when the cabinet is not configured', async () => {
    const guard = new RealtorGuard(fakeConfig({}), fakePrisma);
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});

describe('AdminGuard', () => {
  it('accepts the configured token', () => {
    const guard = new AdminGuard(fakeConfig({ ADMIN_TOKEN: 'admin-token-16-belgi' }));
    expect(
      guard.canActivate(contextFor({ headers: { 'x-admin-token': 'admin-token-16-belgi' } })),
    ).toBe(true);
  });

  it('rejects a wrong or missing token', () => {
    const guard = new AdminGuard(fakeConfig({ ADMIN_TOKEN: 'admin-token-16-belgi' }));
    expect(() => guard.canActivate(contextFor({ headers: { 'x-admin-token': 'yolg' } }))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(ForbiddenException);
  });

  it('answers 503 when no admin token is configured', () => {
    const guard = new AdminGuard(fakeConfig({}));
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(
      ServiceUnavailableException,
    );
  });
});
