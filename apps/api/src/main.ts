import 'reflect-metadata';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import type { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Railway/Render ortida haqiqiy mijoz IP'si X-Forwarded-For da keladi.
  app.set('trust proxy', 1);

  // Task 11 (swipe galereya) rasmlarsiz mazmunli tekshirilmaydi — shu sababdan
  // static serving Task 14'dan oldinroq qo'shildi. Bu vaqtinchalik: Task 14'ning
  // sozla() yordamchisi SPA dist'ini va OG head-inject'ni ham shu bilan birga
  // bitta joyga jamlaydi — shunda bu yerdagi qator o'sha yerga ko'chiriladi,
  // takrorlanmaydi.
  app.useStaticAssets(join(process.cwd(), 'public', 'images'), { prefix: '/images/' });

  // SSR kontrolleri (Task 14) prefiksdan tashqarida bo'lishi uchun aniq ro'yxat ishlatiladi.
  app.setGlobalPrefix('api', { exclude: [] });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Rieltor Generator API')
      .setDescription("Obyekt sahifasi va ko'rishlar hisoblagichi")
      .setVersion('0.1')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));

  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

void bootstrap();
