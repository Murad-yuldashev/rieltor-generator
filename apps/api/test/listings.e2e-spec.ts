import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListingDetailSchema, ListingSummarySchema } from '@rieltor/shared';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('Objects (e2e)', () => {
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

  it('GET /api/objects → seed qilingan 10 obyekt', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects').expect(200);
    expect(res.body).toHaveLength(10);
    for (const item of res.body) {
      expect(() => ListingSummarySchema.parse(item)).not.toThrow();
    }
  });

  it("GET /api/objects/bx-002 → to'liq obyekt", async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-002').expect(200);
    const listing = ListingDetailSchema.parse(res.body);
    expect(listing.type).toBe('SECONDARY');
    expect(listing.images.length).toBeGreaterThan(0);
    expect(listing.agent.phone).toMatch(/^\+998/);
  });

  it('hovlida qavat null', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-003').expect(200);
    expect(res.body.floor).toBeNull();
  });

  it('narxSom satr sifatida keladi', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-002').expect(200);
    expect(typeof res.body.priceSom).toBe('string');
  });

  it("mavjud bo'lmagan id → 404", async () => {
    await request(app.getHttpServer()).get('/api/objects/yoq-000').expect(404);
  });
});
