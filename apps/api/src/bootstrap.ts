import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';

/**
 * main.ts va barcha e2e testlar shu funksiyani ishlatadi —
 * prefiks/exclude ro'yxati ikki joyda ayrilib qolmasligi uchun.
 */
export function sozla(app: NestExpressApplication): void {
  // Railway/Render ortida haqiqiy mijoz IP'si X-Forwarded-For da keladi.
  app.set('trust proxy', 1);

  // Statik JS/CSS va SSR HTML'ni gzip/br bilan siqish — bundle 4x kichrayadi.
  // Boshqa handler'lardan oldin turishi shart, aks holda ular siqilmaydi.
  app.use(compression());

  // SSR marshrutlari 'api' prefiksidan tashqarida bo'lishi shart.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'obj/:id', method: RequestMethod.GET },
    ],
  });

  const apiRoot = resolve(__dirname, '..');
  const publicDir = join(apiRoot, 'public');
  if (existsSync(publicDir)) {
    // Rasmlar: /images/... — kontent-adresli emas, shuning uchun mo'tadil kesh.
    app.useStaticAssets(publicDir, { maxAge: '7d' });
  }

  const webDist = process.env.WEB_DIST ?? resolve(apiRoot, '..', 'web', 'dist');
  if (existsSync(webDist)) {
    // index:false — '/' ni SsrController ushlashi uchun.
    // Vite asset nomlari hash'li, shuning uchun uzoq muddatli immutable kesh.
    app.useStaticAssets(webDist, { index: false, maxAge: '1y', immutable: true });
  }
}
