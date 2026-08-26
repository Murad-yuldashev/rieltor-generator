import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { AuthModule } from '../auth/auth.module';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ValuationModule } from '../valuation/valuation.module';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    AuthModule,
    ValuationModule,
    ListingsModule,
    NotificationsModule,
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('TELEGRAM_BOT_TOKEN') ?? '',
        // We launch manually in BotService so a bad token can't crash boot.
        launchOptions: false,
        middlewares: [session()],
      }),
    }),
  ],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
