import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import type { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
