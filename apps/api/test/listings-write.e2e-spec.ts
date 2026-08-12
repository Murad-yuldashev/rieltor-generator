import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'e2e-dev-login-secret';
const TG_ID = 880011;

describe('Listings write (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  let realtorId: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:E2E-BOT';
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    // Imported after the env is set: app.module.ts decides at import time whether the
    // dev-login module is registered.
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'E2E Rieltor' })
      .expect(201);
    cookie = login.headers['set-cookie']![0]!;

    const me = await request(app.getHttpServer()).get('/api/me').set('cookie', cookie).expect(200);
    realtorId = me.body.id;
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { realtorId } });
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('creates a draft and then updates it', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({ title: 'Boshlang‘ich' })
      .expect(201);
    expect(created.body.id).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/api/objects/${created.body.id}`)
      .set('cookie', cookie)
      .send({ district: 'Chilonzor tumani' })
      .expect(200);
  });

  it('rejects an anonymous create', async () => {
    await request(app.getHttpServer()).post('/api/objects').send({ title: 'X' }).expect(401);
  });

  it('refuses to publish an incomplete draft', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({ title: 'Qisqa e‘lon' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/objects/${created.body.id}/status`)
      .set('cookie', cookie)
      .send({ to: 'ACTIVE' })
      .expect(422);
  });

  it('publishes a complete draft once an image and phone exist', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({
        title: '3 xonali kvartira Chilonzorda',
        priceSom: '780000000',
        priceUsd: 65000,
        areaM2: 78,
        district: 'Chilonzor tumani',
        type: 'SECONDARY',
        deal: 'SALE',
        rooms: 3,
      })
      .expect(201);
    const id = created.body.id;

    // Publish needs an image row and a profile phone; a trusted realtor lands ACTIVE.
    await prisma.image.create({
      data: {
        listingId: id,
        base: `/images/${id}/01`,
        ogUrl: null,
        width: 1200,
        height: 800,
        position: 1,
      },
    });
    await prisma.realtor.update({
      where: { id: realtorId },
      data: { phone: '+998901234567', trusted: true },
    });

    const published = await request(app.getHttpServer())
      .post(`/api/objects/${id}/status`)
      .set('cookie', cookie)
      .send({ to: 'ACTIVE' })
      .expect(201);
    expect(published.body.status).toBe('ACTIVE');
  });
});
