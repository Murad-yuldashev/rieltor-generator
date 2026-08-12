import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { envSchema } from './config/env';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { AuthDevModule } from './auth-dev/auth-dev.module';
import { HealthModule } from './health/health.module';
import { ListingsModule } from './listings/listings.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtorsModule } from './realtors/realtors.module';
import { ShareModule } from './share/share.module';
import { SsrModule } from './ssr/ssr.module';
import { ViewsModule } from './views/views.module';

// Captured before `ConfigModule.forRoot` below ever runs. `ConfigModule.forRoot`
// is declared `async`, and a JS async function body executes synchronously up to
// its first `await` — its first `await` sits well after it calls `validate` and
// backfills the result into `process.env` (envSchema defaults NODE_ENV to
// 'development'). So by the time the array literal below reaches the
// AuthDevModule conditional, `process.env.NODE_ENV` has already been rewritten
// to 'development' and an unset NODE_ENV would incorrectly pass the allowlist.
// Reading it into this module-level const at import time, before forRoot runs,
// is what makes an unset NODE_ENV actually fail closed.
const RAW_NODE_ENV = process.env.NODE_ENV;

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
    MediaModule,
    ViewsModule,
    AuthModule,
    RealtorsModule,
    ShareModule,
    AnalyticsModule,
    // A positive allowlist rather than `!== 'production'`: NODE_ENV is not reliably
    // set on every deploy path (Netlify's build environment is the exception, not
    // the rule), so an unset NODE_ENV must fail closed instead of defaulting this
    // module into a production build (spec §7.2). Uses RAW_NODE_ENV (captured
    // above, before ConfigModule.forRoot backfills process.env.NODE_ENV with its
    // 'development' default) rather than process.env.NODE_ENV directly.
    ...(['development', 'test'].includes(RAW_NODE_ENV ?? '') && process.env.DEV_LOGIN_SECRET
      ? [AuthDevModule]
      : []),
    SsrModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
