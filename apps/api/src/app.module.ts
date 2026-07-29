import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { envSchema } from './config/env';
import { HealthModule } from './health/health.module';
import { ObjectsModule } from './objects/objects.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Noto'g'ri env bilan ilova umuman ko'tarilmaydi — sekin nosozlikdan yaxshiroq.
      validate: (raw) => envSchema.parse(raw),
    }),
    PrismaModule,
    HealthModule,
    ObjectsModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
