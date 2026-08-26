import type { ListingStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { formatPriceSom } from '@rieltor/shared';
import { Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { AuthService } from '../auth/auth.service';
import type { Env } from '../config/env';
import { ListingsService } from '../listings/listings.service';

/** Scene id — must match bot.update.ts's `ctx.scene.enter('mine')`. */
const SCENE_ID = 'mine';

/**
 * Prisma ListingStatus → Uzbek labels, kept verbatim in sync with the web's
 * STATUS_META (apps/web/src/pages/my-listings/ui/status-chip.tsx). That map lives
 * behind the web workspace's FSD boundary the API can't cross, so the copy is
 * duplicated on purpose. Keying the Record on ListingStatus makes it total, so a
 * new enum member can't ship without a label.
 */
const STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: 'Qoralama',
  MODERATION: 'Moderatsiyada',
  PUBLISHED: 'Chop etilgan',
  REJECTED: 'Rad etilgan',
  ARCHIVED: 'Arxivlangan',
};

type BotContext = Scenes.SceneContext;

/** One listing row as returned by ListingsService.listMine (priceSom is a string). */
type MineRow = Awaited<ReturnType<ListingsService['listMine']>>[number];

@Scene(SCENE_ID)
export class MineScene {
  constructor(
    private readonly auth: AuthService,
    private readonly listings: ListingsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    // Telegraf types `ctx.from` as possibly undefined (e.g. channel posts). We
    // need a user to look up their listings, so bail out cleanly if it is missing.
    if (!ctx.from) {
      await ctx.reply('Foydalanuvchini aniqlab bo‘lmadi. /start bilan qaytadan boshlang.');
      await ctx.scene.leave();
      return;
    }

    let rows: MineRow[];
    try {
      const user = await this.auth.ensureTelegramUser({
        id: ctx.from.id,
        first_name: ctx.from.first_name,
      });
      rows = await this.listings.listMine(user.id);
    } catch {
      await ctx.reply("E'lonlarni yuklab bo‘lmadi. Iltimos, keyinroq urinib ko‘ring.");
      await ctx.scene.leave();
      return;
    }

    if (rows.length === 0) {
      await ctx.reply("Hali e'loningiz yo'q.");
      await ctx.scene.leave();
      return;
    }

    const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
    const text = rows.map((row) => this.renderRow(row, baseUrl)).join('\n\n');
    // Plain text on purpose: Telegram auto-links the bare URL, so we dodge the
    // MarkdownV2/HTML escaping traps around Uzbek apostrophes (e.g. "yo'q"). The
    // link preview is disabled so a list of many listings stays compact.
    await ctx.reply(text, { link_preview_options: { is_disabled: true } });
    await ctx.scene.leave();
  }

  private renderRow(row: MineRow, baseUrl: string): string {
    // Drafts persist with an empty title — show a placeholder instead of a blank line.
    const title = row.title.trim() || '(nomsiz qoralama)';
    const lines = [title, `Holat: ${STATUS_LABEL[row.status]}`];
    // Drafts start at price 0; "0 so'm" would read as a real price, so skip it there.
    if (row.priceSom !== '0') {
      lines.push(`Narx: ${formatPriceSom(row.priceSom, row.deal)}`);
    }
    lines.push(`${baseUrl}/obj/${row.id}`);
    return lines.join('\n');
  }
}
