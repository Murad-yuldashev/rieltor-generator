import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * The thinnest possible wrapper around Telegram's Bot API `sendMessage` (stage 5,
 * design spec §8.4: the new-lead ping from LeadsService and the 24h stale-lead
 * reminder from MaintenanceService are both just a chatId + Uzbek text through
 * this one method). Every call is safe to await unconditionally — a missing
 * TELEGRAM_BOT_TOKEN, a network failure, or a non-200 response are all caught
 * here and only logged, matching the project's "an unset optional env degrades a
 * feature, it never crashes the app" rule (spec §7.3).
 *
 * TODO(stage 6+): this service only ever calls OUT to Telegram. The inbound half —
 * a webhook that receives the realtor's shared contact and sets
 * Realtor.phoneVerified = true (spec §5.2, §7.1) — is out of scope for stage 5.
 * The existing listing-expiry banner (stage 4, spec §7.5) also stays cabinet-only
 * for now; wiring it through this same method is a natural follow-up, not done here.
 */
@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async sendMessage(chatId: string | number | bigint, text: string): Promise<void> {
    const token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    if (!token) {
      this.logger.debug(`TELEGRAM_BOT_TOKEN sozlanmagan, xabar yuborilmadi (chatId=${chatId})`);
      return;
    }

    try {
      const res = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // chat_id travels as a string — bigint is not JSON-serialisable, and
        // Telegram's API accepts a numeric chat id in string form just as well.
        body: JSON.stringify({ chat_id: chatId.toString(), text }),
      });
      if (!res.ok) {
        this.logger.warn(`Telegram sendMessage muvaffaqiyatsiz: HTTP ${res.status}`);
      }
    } catch (error) {
      this.logger.warn(`Telegram sendMessage xatosi: ${String(error)}`);
    }
  }
}
