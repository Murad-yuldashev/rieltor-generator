import { formatPriceSom, TASHKENT_DISTRICTS } from '@rieltor/shared';
import type { ListingType } from '@rieltor/shared';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ValuationService } from '../valuation/valuation.service';

/** Scene id — must match bot.update.ts's `ctx.scene.enter('valuation')`. */
const SCENE_ID = 'valuation';

/**
 * Listing-type labels, kept verbatim in sync with the web's LISTING_TYPE_META
 * (apps/web/src/entities/listing/lib/type-meta.ts). That map cannot be imported
 * here: it lives in the web workspace behind an FSD boundary the API can't cross,
 * so the copy is duplicated on purpose. The emoji only dress up the buttons; the
 * label text is what must match the web.
 */
const TYPE_LABEL: Record<ListingType, string> = {
  NEW_BUILD: 'Yangi qurilish',
  SECONDARY: 'Ikkilamchi',
  HOUSE: 'Hovli',
  COMMERCIAL: 'Tijorat',
};

const TYPE_EMOJI: Record<ListingType, string> = {
  NEW_BUILD: '🏗',
  SECONDARY: '🏢',
  HOUSE: '🏡',
  COMMERCIAL: '🏪',
};

const LISTING_TYPES: readonly ListingType[] = ['NEW_BUILD', 'SECONDARY', 'HOUSE', 'COMMERCIAL'];

/** Mirrors ValuationRequestSchema's ceiling — rejects absurd area input. */
const MAX_AREA_M2 = 10_000;

/**
 * Wizard state carried across steps via the Telegraf session. Extending
 * SceneSessionData and parametrising SceneContext with it is what makes
 * `ctx.scene.session.type` (etc.) typecheck under strict TS.
 */
interface ValuationSceneSession extends Scenes.SceneSessionData {
  type?: ListingType;
  district?: string;
  rooms?: number | null;
}

type BotContext = Scenes.SceneContext<ValuationSceneSession>;

/** Regex `@Action`s get `ctx.match` (the RegExpExecArray) set by Telegraf at runtime. */
type ActionContext = BotContext & { match: RegExpExecArray };

function isListingType(value: string): value is ListingType {
  return (LISTING_TYPES as readonly string[]).includes(value);
}

/** Splits buttons into rows of at most `size` for a tidy inline keyboard. */
function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

@Scene(SCENE_ID)
export class ValuationScene {
  constructor(private readonly valuation: ValuationService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    // Clear any leftover state so a reenter always starts fresh.
    ctx.scene.session.type = undefined;
    ctx.scene.session.district = undefined;
    ctx.scene.session.rooms = undefined;

    const buttons: InlineKeyboardButton[] = LISTING_TYPES.map((type) =>
      Markup.button.callback(`${TYPE_EMOJI[type]} ${TYPE_LABEL[type]}`, `type:${type}`),
    );
    await ctx.reply(
      'Uyni baholaymiz. Obyekt turini tanlang:',
      Markup.inlineKeyboard(chunk(buttons, 2)),
    );
  }

  @Action(/^type:(.+)$/)
  async onType(@Ctx() ctx: ActionContext) {
    await ctx.answerCbQuery();
    const value = ctx.match[1];
    if (value === undefined || !isListingType(value)) {
      await ctx.reply("Noma'lum tur. Iltimos, tugmalardan birini tanlang.");
      return;
    }
    ctx.scene.session.type = value;

    // District names are short; an index keeps callback_data well under 64 bytes.
    const buttons: InlineKeyboardButton[] = TASHKENT_DISTRICTS.map((name, i) =>
      Markup.button.callback(name, `district:${i}`),
    );
    await ctx.reply('Tumanni tanlang:', Markup.inlineKeyboard(chunk(buttons, 2)));
  }

  @Action(/^district:(.+)$/)
  async onDistrict(@Ctx() ctx: ActionContext) {
    await ctx.answerCbQuery();
    const district = TASHKENT_DISTRICTS[Number(ctx.match[1])];
    if (district === undefined) {
      await ctx.reply("Tuman topilmadi. Iltimos, ro'yxatdan tanlang.");
      return;
    }
    ctx.scene.session.district = district;

    // Commercial valuations ignore room count — skip straight to the area step.
    if (ctx.scene.session.type === 'COMMERCIAL') {
      ctx.scene.session.rooms = null;
      await this.askArea(ctx);
      return;
    }

    const buttons: InlineKeyboardButton[] = [1, 2, 3, 4, 5].map((n) =>
      Markup.button.callback(String(n), `rooms:${n}`),
    );
    buttons.push(Markup.button.callback('6+', 'rooms:6'));
    await ctx.reply('Xonalar sonini tanlang:', Markup.inlineKeyboard(chunk(buttons, 3)));
  }

  @Action(/^rooms:(.+)$/)
  async onRooms(@Ctx() ctx: ActionContext) {
    await ctx.answerCbQuery();
    const rooms = Number(ctx.match[1]);
    if (!Number.isInteger(rooms) || rooms <= 0) {
      await ctx.reply('Iltimos, xonalar sonini tugmadan tanlang.');
      return;
    }
    ctx.scene.session.rooms = rooms;
    await this.askArea(ctx);
  }

  @On('text')
  async onArea(@Ctx() ctx: BotContext) {
    const { type, district, rooms } = ctx.scene.session;
    // The earlier steps are button-driven, so any text before the area step is a
    // stray message — nudge the user back to the buttons instead of computing.
    if (type === undefined || district === undefined || rooms === undefined) {
      await ctx.reply('Iltimos, yuqoridagi tugmalardan foydalaning.');
      return;
    }

    const message = ctx.message;
    const raw = message && 'text' in message ? message.text : '';
    const areaM2 = Number(raw.trim().replace(',', '.'));
    if (!Number.isFinite(areaM2) || areaM2 <= 0 || areaM2 > MAX_AREA_M2) {
      await ctx.reply('Iltimos, maydonni musbat raqam bilan kiriting (masalan 65).');
      return;
    }

    const result = await this.valuation.estimate({ type, district, rooms, areaM2 });
    const text = [
      `💰 Taxminiy narx: ${formatPriceSom(result.estimateSom, 'SALE')}`,
      `📊 Oraliq: ${formatPriceSom(result.lowSom, 'SALE')} – ${formatPriceSom(result.highSom, 'SALE')}`,
      '',
      result.explanation,
    ].join('\n');

    await ctx.reply(
      text,
      Markup.inlineKeyboard([
        [Markup.button.callback("➕ E'lon joylash", 'valuation:list')],
        [Markup.button.callback('🔄 Qayta hisoblash', 'valuation:again')],
      ]),
    );
    // NB: we deliberately do NOT leave() here. The two follow-up buttons are
    // handled by this scene's @Action methods below, which only fire while the
    // scene is current; leaving now would orphan them (and reenter() is a no-op
    // once the scene is left). The buttons drive the transition instead.
  }

  @Action('valuation:list')
  async onPlaceListing(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    // The listing scene lands in Task 7; entering an unregistered scene is a
    // harmless no-op until then.
    await ctx.scene.enter('listing');
  }

  @Action('valuation:again')
  async onRecalculate(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.scene.reenter();
  }

  private async askArea(ctx: BotContext) {
    await ctx.reply('Maydonni kiriting (m², masalan 65):');
  }
}
