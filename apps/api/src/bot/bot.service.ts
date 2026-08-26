import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { TelegramNotifier } from '../notifications/telegram-notifier';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  botReady = false;

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly notifier: TelegramNotifier,
  ) {}

  async onModuleInit() {
    // nestjs-telegraf's TelegrafCoreModule calls bot.stop() on application
    // shutdown unconditionally, and telegraf throws "Bot is not running!" when
    // the bot was never launched (dormant/placeholder token). That would break
    // teardown — e.g. every e2e afterAll's app.close(). Wrap stop() so a dormant
    // shutdown is a safe no-op; a launched bot still stops normally.
    const stopBot = this.bot.stop.bind(this.bot);
    this.bot.stop = (reason?: string) => {
      try {
        stopBot(reason);
      } catch (error) {
        this.logger.debug(`Telegram bot stop skipped (not running): ${String(error)}`);
      }
    };

    try {
      // getMe() fails fast on an invalid/placeholder token, so boot never hangs
      // and a dormant bot degrades gracefully (dev, CI, no real token).
      await this.bot.telegram.getMe();
      // launch() resolves once long-polling starts. It can still reject *after*
      // getMe succeeds (e.g. a network blip), so guard it — an unhandled
      // rejection here would otherwise crash the process.
      this.bot
        .launch()
        .catch((error) => this.logger.warn(`Telegram bot polling stopped: ${String(error)}`));
      this.botReady = true;
      // Only once the bot is live do we let notifications flow over Telegram.
      // Wrapped in an async arrow so the sender resolves to void (TelegramNotifier's
      // SendFn), discarding sendMessage's returned Message payload.
      this.notifier.register(async (telegramId, text) => {
        await this.bot.telegram.sendMessage(telegramId, text);
      });
      this.logger.log('Telegram bot launched (long-polling)');
    } catch (error) {
      this.logger.warn(`Telegram bot dormant — launch skipped: ${String(error)}`);
    }
  }
}
