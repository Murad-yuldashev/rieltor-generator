import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

/**
 * Builds the application the same way for every runtime: main.ts for the long-running
 * server, netlify/functions/api.js for the serverless one. Same reason bootstrap.ts
 * exists — anything wired up in only one of the two entry points silently drifts.
 *
 * The app is returned un-initialised: main.ts lets listen() do it, the Netlify handler
 * calls init() itself because it never listens on a port.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Rieltor Generator API')
      .setDescription("Obyekt sahifasi va ko'rishlar hisoblagichi")
      .setVersion('0.1')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));

  return app;
}
