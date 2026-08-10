import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { envSchema } from './config/env';
import { AuthModule } from './auth/auth.module';
import { AuthDevModule } from './auth-dev/auth-dev.module';
import { HealthModule } from './health/health.module';
import { ListingsModule } from './listings/listings.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtorsModule } from './realtors/realtors.module';
import { SsrModule } from './ssr/ssr.module';
import { ViewsModule } from './views/views.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // A bad env stops the app from booting at all — better than a slow failure.
      validate: (raw) => envSchema.parse(raw),
    }),
    PrismaModule,
    HealthModule,
    ListingsModule,
    ViewsModule,
    AuthModule,
    RealtorsModule,
    // Never in production: the module is not even constructed there (spec §7.2).
    ...(process.env.NODE_ENV !== 'production' && process.env.DEV_LOGIN_SECRET
      ? [AuthDevModule]
      : []),
    SsrModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
