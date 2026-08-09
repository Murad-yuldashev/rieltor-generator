import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE } from '../src/auth/cookie';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'dev-login-secret';
const TG_ID = 990002;

describe('Dev login (e2e)', () => {
  let app: NestExpressApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

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

  it('POST /api/auth/dev → profile and a session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'Dev Rieltor' })
      .expect(201);

    expect(res.body.name).toBe('Dev Rieltor');
    expect(res.headers['set-cookie']![0]).toContain(`${SESSION_COOKIE}=`);
  });

  it('rejects a wrong secret', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: 'yolg‘on', tgId: TG_ID })
      .expect(401);
  });
});
