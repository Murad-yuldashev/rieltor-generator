import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ZodValidationPipe } from 'nestjs-zod';
import { AgentModule } from './agent/agent.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { BotModule } from './bot/bot.module';
import { envSchema } from './config/env';
import { HealthModule } from './health/health.module';
import { LeadsModule } from './leads/leads.module';
import { ListingsModule } from './listings/listings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PresentationsModule } from './presentations/presentations.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { RealtorPublicModule } from './realtor-public/realtor-public.module';
import { RequestsModule } from './requests/requests.module';
import { SavedSearchModule } from './saved-search/saved-search.module';
import { SsrModule } from './ssr/ssr.module';
import { ValuationModule } from './valuation/valuation.module';
import { ViewsModule } from './views/views.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // A bad env stops the app from booting at all — better than a slow failure.
      validate: (raw) => envSchema.parse(raw),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AgentModule,
    AiModule,
    AuthModule,
    BotModule,
    HealthModule,
    LeadsModule,
    ListingsModule,
    NotificationsModule,
    PresentationsModule,
    PropertiesModule,
    RealtorPublicModule,
    RequestsModule,
    SavedSearchModule,
    ValuationModule,
    ViewsModule,
    WalletModule,
    SsrModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
