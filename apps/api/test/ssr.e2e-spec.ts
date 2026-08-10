import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

const SHELL_HTML = `<!doctype html>
<html lang="uz"><head><meta charset="UTF-8" /><title>Rieltor Generator</title><!--OG-META--></head>
<body><div id="root"></div></body></html>`;

describe('SSR / OG (e2e)', () => {
  let app: NestExpressApplication;
  let distDir: string;

  beforeAll(async () => {
    distDir = await mkdtemp(join(tmpdir(), 'rieltor-dist-'));
    await writeFile(join(distDir, 'index.html'), SHELL_HTML, 'utf8');
    process.env.WEB_DIST = distDir;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await rm(distDir, { recursive: true, force: true });
    delete process.env.WEB_DIST;
  });

  it('GET /obj/bx-001 → 200 va og:title narx bilan', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('property="og:title"');
    expect(res.text).toContain('859 435 200 so&#39;m');
  });

  it('og:image absolyut URL', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    const moslik = /property="og:image" content="([^"]+)"/.exec(res.text);
    expect(moslik?.[1]).toMatch(/^https?:\/\/.+\/images\/bx-001\/og\.jpg$/);
  });

  it('LCP rasmi preload qilinadi', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.text).toContain('rel="preload"');
    expect(res.text).toContain('imagesrcset=');
  });

  it('marker qolmaydi', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.text).not.toContain('<!--OG-META-->');
  });

  it('sahifada faqat bitta <title> qoladi', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.text.match(/<title>/g)).toHaveLength(1);
    expect(res.text).toContain('859 435 200');
  });

  it("mavjud bo'lmagan id → 404, lekin HTML qaytaradi", async () => {
    const res = await request(app.getHttpServer()).get('/obj/yoq-000').expect(404);
    expect(res.text).toContain('<div id="root">');
    expect(res.text).not.toContain('og:title');
  });

  it("GET / → 200 SPA qobig'i", async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('<div id="root">');
  });

  it('/api/health hamon ishlaydi', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  it("mos marshrut yo'q yo'l (/foo) → 404, uslublangan SPA qobig'i", async () => {
    const res = await request(app.getHttpServer()).get('/foo').expect(404);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<div id="root">');
    expect(res.text).not.toContain('og:title');
  });

  it("chuqur mos kelmagan yo'l (/obj/bx-001/ortiqcha) → 404, SPA qobig'i", async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001/ortiqcha').expect(404);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<div id="root">');
  });

  it("/api ostidagi topilmagan yo'l JSON bo'lib qoladi", async () => {
    const res = await request(app.getHttpServer()).get('/api/yoq-endpoint').expect(404);
    expect(res.headers['content-type']).toContain('application/json');
  });

  it.each(['/cabinet', '/cabinet/profile'])('GET %s → the SPA shell with a 200', async (path) => {
    const res = await request(app.getHttpServer()).get(path).expect(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<div id="root">');
  });
});
