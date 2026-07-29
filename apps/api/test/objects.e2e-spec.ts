import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ObjectDetailSchema, ObjectListItemSchema } from '@rieltor/shared';
import { AppModule } from '../src/app.module';

describe('Objects (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: [] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/objects → seed qilingan 3 obyekt', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects').expect(200);
    expect(res.body).toHaveLength(3);
    for (const item of res.body) {
      expect(() => ObjectListItemSchema.parse(item)).not.toThrow();
    }
  });

  it("GET /api/objects/bx-002 → to'liq obyekt", async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-002').expect(200);
    const obj = ObjectDetailSchema.parse(res.body);
    expect(obj.turi).toBe('IKKILAMCHI');
    expect(obj.rasmlar.length).toBeGreaterThan(0);
    expect(obj.agent.tel).toMatch(/^\+998/);
  });

  it('hovlida qavat null', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-003').expect(200);
    expect(res.body.qavat).toBeNull();
  });

  it('narxSom satr sifatida keladi', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-002').expect(200);
    expect(typeof res.body.narxSom).toBe('string');
  });

  it("mavjud bo'lmagan id → 404", async () => {
    await request(app.getHttpServer()).get('/api/objects/yoq-000').expect(404);
  });
});
