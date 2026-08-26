import { Injectable, Logger } from '@nestjs/common';

type SendFn = (telegramId: string, text: string) => Promise<void>;

/**
 * A seam so notifications can be delivered over Telegram without NotificationsModule
 * depending on the bot. The bot registers its sender at launch; until then (dev, CI,
 * no token) `send` is a no-op and only the in-app notification is written.
 */
@Injectable()
export class TelegramNotifier {
  private readonly logger = new Logger(TelegramNotifier.name);
  private sender: SendFn | null = null;

  register(send: SendFn) {
    this.sender = send;
  }

  get isActive() {
    return this.sender !== null;
  }

  async send(telegramId: string, text: string) {
    if (!this.sender) return;
    try {
      await this.sender(telegramId, text);
    } catch (error) {
      this.logger.warn(`Telegram DM failed for ${telegramId}: ${String(error)}`);
    }
  }
}
