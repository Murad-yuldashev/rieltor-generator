import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'dev-login-gate-secret';
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

describe('Dev login gate with unset NODE_ENV (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;
    delete process.env.NODE_ENV;

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('POST /api/auth/dev → 404 when NODE_ENV is unset, even with DEV_LOGIN_SECRET set', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: 990003 })
      .expect(404);
  });

  it('GET /api/health → 200, proving the app still boots with no NODE_ENV', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: true });
  });
});
