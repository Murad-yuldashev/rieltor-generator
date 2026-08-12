import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'e2e-dev-login-secret';
const TG_ID = 880022;

describe('Listing visibility (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  let realtorId: string;
  let draftId: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:E2E-BOT';
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'E2E Ko‘rinish' })
      .expect(201);
    cookie = login.headers['set-cookie']![0]!;
    const me = await request(app.getHttpServer()).get('/api/me').set('cookie', cookie).expect(200);
    realtorId = me.body.id;

    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({ title: 'Faqat qoralama' })
      .expect(201);
    draftId = created.body.id;
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { realtorId } });
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('keeps the seed listings on the public feed', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((l: { id: string }) => l.id === 'bx-001')).toBe(true);
    // The draft just created must not leak into the public feed.
    expect(res.body.some((l: { id: string }) => l.id === draftId)).toBe(false);
  });

  it('serves a seed listing detail but 404s a draft for the public', async () => {
    await request(app.getHttpServer()).get('/api/objects/bx-001').expect(200);
    await request(app.getHttpServer()).get(`/api/objects/${draftId}`).expect(404);
  });

  it('shows the realtor their own draft with its status', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/me/objects')
      .set('cookie', cookie)
      .expect(200);
    const mine = list.body.find((l: { id: string }) => l.id === draftId);
    expect(mine.status).toBe('DRAFT');

    const one = await request(app.getHttpServer())
      .get(`/api/me/objects/${draftId}`)
      .set('cookie', cookie)
      .expect(200);
    expect(one.body.status).toBe('DRAFT');
  });
});
