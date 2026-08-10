import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'dev-login-secret';
const TG_ID = 990003;

describe('Me (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'Me Rieltor' })
      .expect(201);
    cookie = login.headers['set-cookie']![0]!;
  });

  afterAll(async () => {
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /api/me without a cookie → 401', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
  });

  it('GET /api/me with a session → the profile', async () => {
    const res = await request(app.getHttpServer()).get('/api/me').set('cookie', cookie).expect(200);
    expect(res.body.name).toBe('Me Rieltor');
    expect(res.body.phone).toBeNull();
    expect(res.body.trusted).toBe(false);
  });

  it('PATCH /api/me saves the profile fields', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/me')
      .set('cookie', cookie)
      .send({ phone: '+998901234567', agency: "Toshkent Ko'chmas Mulk", name: 'Me Valiyev' })
      .expect(200);

    expect(res.body.phone).toBe('+998901234567');
    expect(res.body.agency).toBe("Toshkent Ko'chmas Mulk");
    expect(res.body.name).toBe('Me Valiyev');
  });

  it('PATCH /api/me rejects a malformed phone number', async () => {
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('cookie', cookie)
      .send({ phone: '901234567' })
      .expect(400);
  });

  it('PATCH /api/me without a cookie → 401', async () => {
    await request(app.getHttpServer()).patch('/api/me').send({ name: 'Hech kim' }).expect(401);
  });
});
