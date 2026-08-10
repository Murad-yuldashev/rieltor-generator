import { createHash, createHmac } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE } from '../src/auth/cookie';
import { configureApp } from '../src/bootstrap';

const BOT_TOKEN = '123456:E2E-BOT-TOKEN';
const TG_ID = 990001;

/** Signs a payload the way the widget does, so the test never reuses src/ code. */
function signedPayload(overrides: Record<string, string | number> = {}) {
  const fields: Record<string, string | number> = {
    id: TG_ID,
    first_name: 'E2eAli',
    username: 'e2e_ali',
    auth_date: Math.floor(Date.now() / 1000),
    ...overrides,
  };

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');
  const secret = createHash('sha256').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return { ...fields, hash };
}

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';

    // Imported after the env is in place: app.module.ts builds its imports array
    // (including the conditional dev-login module) while the file is being evaluated.
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /api/auth/telegram → profile and a session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload())
      .expect(201);

    expect(res.body.name).toBe('E2eAli');
    expect(res.body.username).toBe('e2e-ali');
    expect(res.body.phone).toBeNull();
    expect(res.body).not.toHaveProperty('tgId');

    const cookie = res.headers['set-cookie']![0];
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('a repeat login keeps the same realtor', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload())
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload({ first_name: 'E2eVali' }))
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(second.body.name).toBe('E2eVali');
  });

  it('rejects a tampered hash', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send({ ...signedPayload(), first_name: 'Soxta' })
      .expect(401);
  });

  it('rejects an auth_date older than a day', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload({ auth_date: Math.floor(Date.now() / 1000) - 90_000 }))
      .expect(401);
  });

  it('rejects a body that is not a widget payload', async () => {
    await request(app.getHttpServer()).post('/api/auth/telegram').send({ id: 1 }).expect(400);
  });

  it('POST /api/auth/logout clears the cookie', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/logout').expect(201);
    expect(res.headers['set-cookie']![0]).toContain('Max-Age=0');
  });
});
