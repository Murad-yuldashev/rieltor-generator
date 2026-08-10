import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const fullEnv = {
  DATABASE_URL: 'postgresql://rieltor:rieltor@localhost:5432/rieltor',
  PUBLIC_BASE_URL: 'http://localhost:3000',
};

describe('envSchema', () => {
  it('defaults PORT to 3000', () => {
    expect(envSchema.parse(fullEnv).PORT).toBe(3000);
  });

  it('coerces PORT from a string to a number', () => {
    expect(envSchema.parse({ ...fullEnv, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => envSchema.parse({ PUBLIC_BASE_URL: fullEnv.PUBLIC_BASE_URL })).toThrow();
  });

  it('rejects a PUBLIC_BASE_URL that is not a URL', () => {
    expect(() => envSchema.parse({ ...fullEnv, PUBLIC_BASE_URL: 'shunchaki-matn' })).toThrow();
  });

  it('strips a trailing slash from PUBLIC_BASE_URL', () => {
    const parsed = envSchema.parse({ ...fullEnv, PUBLIC_BASE_URL: 'https://misol.uz/' });
    expect(parsed.PUBLIC_BASE_URL).toBe('https://misol.uz');
  });

  it('keeps the cabinet variables when they are set', () => {
    const parsed = envSchema.parse({
      ...fullEnv,
      JWT_SECRET: 'e2e-jwt-secret-at-least-16',
      TELEGRAM_BOT_TOKEN: '123456:token',
    });
    expect(parsed.JWT_SECRET).toBe('e2e-jwt-secret-at-least-16');
    expect(parsed.TELEGRAM_BOT_TOKEN).toBe('123456:token');
  });

  it('leaves the cabinet variables undefined when they are not set', () => {
    const parsed = envSchema.parse(fullEnv);
    expect(parsed.TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(parsed.JWT_SECRET).toBeUndefined();
    expect(parsed.ADMIN_TOKEN).toBeUndefined();
    expect(parsed.DEV_LOGIN_SECRET).toBeUndefined();
  });
});
