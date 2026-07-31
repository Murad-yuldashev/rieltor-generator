import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const fullEnv = {
  DATABASE_URL: 'postgresql://rieltor:rieltor@localhost:5432/rieltor',
  PUBLIC_BASE_URL: 'http://localhost:3000',
};

describe('envSchema', () => {
  it("PORT berilmasa 3000 ni qo'yadi", () => {
    expect(envSchema.parse(fullEnv).PORT).toBe(3000);
  });

  it('PORT ni satrdan songa aylantiradi', () => {
    expect(envSchema.parse({ ...fullEnv, PORT: '8080' }).PORT).toBe(8080);
  });

  it("DATABASE_URL yo'q bo'lsa rad etadi", () => {
    expect(() => envSchema.parse({ PUBLIC_BASE_URL: fullEnv.PUBLIC_BASE_URL })).toThrow();
  });

  it("PUBLIC_BASE_URL URL bo'lmasa rad etadi", () => {
    expect(() => envSchema.parse({ ...fullEnv, PUBLIC_BASE_URL: 'shunchaki-matn' })).toThrow();
  });

  it('PUBLIC_BASE_URL oxiridagi slashni olib tashlaydi', () => {
    const parsed = envSchema.parse({ ...fullEnv, PUBLIC_BASE_URL: 'https://misol.uz/' });
    expect(parsed.PUBLIC_BASE_URL).toBe('https://misol.uz');
  });
});
