import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ViewsSchema } from '@rieltor/shared';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('Views (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/view/:id sonni oshiradi', async () => {
    const oldin = await request(app.getHttpServer()).get('/api/view/bx-001').expect(200);
    const keyin = await request(app.getHttpServer())
      .post('/api/view/bx-001')
      .set('X-Forwarded-For', '203.0.113.10')
      .expect(200);

    expect(ViewsSchema.parse(keyin.body).views).toBe(ViewsSchema.parse(oldin.body).views + 1);
  });

  it('bir xil IP dan takror POST sonni oshirmaydi', async () => {
    const birinchi = await request(app.getHttpServer())
      .post('/api/view/bx-002')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);
    const ikkinchi = await request(app.getHttpServer())
      .post('/api/view/bx-002')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);

    expect(ikkinchi.body.views).toBe(birinchi.body.views);
  });

  it('boshqa IP dan POST sonni oshiradi', async () => {
    const birinchi = await request(app.getHttpServer())
      .post('/api/view/bx-003')
      .set('X-Forwarded-For', '203.0.113.30')
      .expect(200);
    const ikkinchi = await request(app.getHttpServer())
      .post('/api/view/bx-003')
      .set('X-Forwarded-For', '203.0.113.31')
      .expect(200);

    expect(ikkinchi.body.views).toBe(birinchi.body.views + 1);
  });

  it('GET sonni oshirmaydi', async () => {
    const a = await request(app.getHttpServer()).get('/api/view/bx-001').expect(200);
    const b = await request(app.getHttpServer()).get('/api/view/bx-001').expect(200);
    expect(b.body.views).toBe(a.body.views);
  });

  it("mavjud bo'lmagan id → 404", async () => {
    await request(app.getHttpServer()).get('/api/view/yoq-000').expect(404);
    await request(app.getHttpServer())
      .post('/api/view/yoq-000')
      .set('X-Forwarded-For', '203.0.113.99')
      .expect(404);
  });
});
