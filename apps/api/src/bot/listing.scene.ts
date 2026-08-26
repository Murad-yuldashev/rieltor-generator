import { HttpException, NotFoundException } from '@nestjs/common';
import { formatPriceSom, TASHKENT_DISTRICTS } from '@rieltor/shared';
import type { Deal, ListingType } from '@rieltor/shared';
import { Action, Command, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { AuthService } from '../auth/auth.service';
import { ListingsService } from '../listings/listings.service';
import { downloadTelegramPhoto } from './telegram-photo';

/** Scene id — must match bot.update.ts's `ctx.scene.enter('listing')` and the
 * valuation scene's follow-up `ctx.scene.enter('listing')`. */
const SCENE_ID = 'listing';

/** Callback data for the "photos done" inline button. */
const DONE_ACTION = 'listing:done';

/**
 * Deal labels — the web wizard's phrasing ("Sotuv yoki ijara"). SALE = sale,
 * RENT = monthly rent.
 */
const DEALS: readonly Deal[] = ['SALE', 'RENT'];
const DEAL_LABEL: Record<Deal, string> = {
  SALE: 'Sotuv',
  RENT: 'Ijara',
};

/**
 * Listing-type labels, kept verbatim in sync with the web's LISTING_TYPE_META
 * (apps/web/src/entities/listing/lib/type-meta.ts). That map lives in the web
 * workspace behind an FSD boundary the API can't cross, so the copy is duplicated
 * on purpose — same rationale as valuation.scene.ts. The emoji only dress up the
 * buttons; the label text is what must match the web.
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

/** Mirrors ListingDraftSchema's ceilings so the bot rejects the same input the web would. */
const MAX_AREA_M2 = 10_000;
const MAX_ROOMS = 20;
const MIN_ADDRESS_LEN = 4;
const MIN_LANDMARK_LEN = 2;
const MIN_TITLE_LEN = 10;
const MAX_TITLE_LEN = 120;
const MIN_DESCRIPTION_LEN = 20;
const MAX_DESCRIPTION_LEN = 4000;
const MAX_IMAGES = 10;

/**
 * The wizard is a linear state machine; `step` names the field the scene is
 * currently waiting on. Button steps are answered by @Action handlers, text
 * steps by the single @On('text') handler switching on this value, and photos
 * by @On('photo') plus the "Tayyor" control.
 */
type Step =
  | 'deal'
  | 'type'
  | 'district'
  | 'address'
  | 'landmark'
  | 'rooms'
  | 'area'
  | 'floor'
  | 'photos'
  | 'title'
  | 'description'
  | 'price';

/**
 * Wizard state carried across steps via the Telegraf session. Extending
 * SceneSessionData and parametrising SceneContext with it is what makes
 * `ctx.scene.session.step` (etc.) typecheck under strict TS.
 */
interface ListingSceneSession extends Scenes.SceneSessionData {
  userId?: string;
  draftId?: string;
  step?: Step;
  deal?: Deal;
  type?: ListingType;
  imageCount?: number;
}

type BotContext = Scenes.SceneContext<ListingSceneSession>;

/** Regex `@Action`s get `ctx.match` (the RegExpExecArray) set by Telegraf at runtime. */
type ActionContext = BotContext & { match: RegExpExecArray };

function isDeal(value: string): value is Deal {
  return (DEALS as readonly string[]).includes(value);
}

function isListingType(value: string): value is ListingType {
  return (LISTING_TYPES as readonly string[]).includes(value);
}

/** Turn a service error into a line we can show the user (BadRequestException carries Uzbek copy). */
function toUserMessage(error: unknown): string {
  if (error instanceof NotFoundException) {
    return "E'lon topilmadi. /start bilan qaytadan boshlang.";
  }
  if (error instanceof HttpException) return error.message;
  return "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
}

/** Splits buttons into rows of at most `size` for a tidy inline keyboard. */
function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** Reads the text out of the current message, or '' if this update isn't a text one. */
function messageText(ctx: BotContext): string {
  const message = ctx.message;
  return message && 'text' in message ? message.text : '';
}

@Scene(SCENE_ID)
export class ListingScene {
  constructor(
    private readonly auth: AuthService,
    private readonly listings: ListingsService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    // Telegraf types `ctx.from` as possibly undefined (e.g. channel posts). We
    // need a user to own the draft, so bail out cleanly if it is missing.
    if (!ctx.from) {
      await ctx.reply('Foydalanuvchini aniqlab bo‘lmadi. /start bilan qaytadan boshlang.');
      await ctx.scene.leave();
      return;
    }

    let userId: string;
    let draftId: string;
    try {
      const user = await this.auth.ensureTelegramUser({
        id: ctx.from.id,
        first_name: ctx.from.first_name,
      });
      const draft = await this.listings.createDraft(user.id);
      userId = user.id;
      draftId = draft.id;
    } catch (error) {
      await ctx.reply(toUserMessage(error));
      await ctx.scene.leave();
      return;
    }

    // Fresh state for every entry so a re-enter can't leak the previous draft.
    ctx.scene.session.userId = userId;
    ctx.scene.session.draftId = draftId;
    ctx.scene.session.deal = undefined;
    ctx.scene.session.type = undefined;
    ctx.scene.session.imageCount = 0;
    ctx.scene.session.step = 'deal';

    const buttons: InlineKeyboardButton[] = DEALS.map((deal) =>
      Markup.button.callback(DEAL_LABEL[deal], `deal:${deal}`),
    );
    await ctx.reply("Yangi e'lon. Bitim turini tanlang:", Markup.inlineKeyboard(chunk(buttons, 2)));
  }

  @Action(/^deal:(.+)$/)
  async onDeal(@Ctx() ctx: ActionContext) {
    await ctx.answerCbQuery();
    if (!this.hasDraft(ctx)) return this.restart(ctx);
    if (ctx.scene.session.step !== 'deal') return;

    const value = ctx.match[1];
    if (value === undefined || !isDeal(value)) {
      await ctx.reply('Iltimos, tugmalardan birini tanlang.');
      return;
    }
    if (!(await this.applyPatch(ctx, { deal: value }))) return;
    ctx.scene.session.deal = value;
    ctx.scene.session.step = 'type';

    const buttons: InlineKeyboardButton[] = LISTING_TYPES.map((type) =>
      Markup.button.callback(`${TYPE_EMOJI[type]} ${TYPE_LABEL[type]}`, `ltype:${type}`),
    );
    await ctx.reply('Obyekt turini tanlang:', Markup.inlineKeyboard(chunk(buttons, 2)));
  }

  @Action(/^ltype:(.+)$/)
  async onType(@Ctx() ctx: ActionContext) {
    await ctx.answerCbQuery();
    if (!this.hasDraft(ctx)) return this.restart(ctx);
    if (ctx.scene.session.step !== 'type') return;

    const value = ctx.match[1];
    if (value === undefined || !isListingType(value)) {
      await ctx.reply("Noma'lum tur. Iltimos, tugmalardan birini tanlang.");
      return;
    }
    if (!(await this.applyPatch(ctx, { type: value }))) return;
    ctx.scene.session.type = value;
    ctx.scene.session.step = 'district';

    // District names are short; an index keeps callback_data well under 64 bytes.
    const buttons: InlineKeyboardButton[] = TASHKENT_DISTRICTS.map((name, i) =>
      Markup.button.callback(name, `district:${i}`),
    );
    await ctx.reply('Tumanni tanlang:', Markup.inlineKeyboard(chunk(buttons, 2)));
  }

  @Action(/^district:(.+)$/)
  async onDistrict(@Ctx() ctx: ActionContext) {
    await ctx.answerCbQuery();
    if (!this.hasDraft(ctx)) return this.restart(ctx);
    if (ctx.scene.session.step !== 'district') return;

    const district = TASHKENT_DISTRICTS[Number(ctx.match[1])];
    if (district === undefined) {
      await ctx.reply("Tuman topilmadi. Iltimos, ro'yxatdan tanlang.");
      return;
    }
    if (!(await this.applyPatch(ctx, { district }))) return;
    ctx.scene.session.step = 'address';
    await ctx.reply('Manzilni kiriting (masalan: Chilonzor 19, 45-uy):');
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: BotContext) {
    if (!this.hasDraft(ctx)) return this.restart(ctx);
    if (ctx.scene.session.step !== 'photos') {
      await ctx.reply('Hozircha rasm kutilmayapti. Iltimos, joriy savolga javob bering.');
      return;
    }

    const message = ctx.message;
    if (!message || !('photo' in message)) return;
    // Telegram sends several sizes of the same photo, ascending; the last is the largest.
    const largest = message.photo.at(-1);
    if (!largest) {
      await ctx.reply('Rasmni o‘qib bo‘lmadi. Iltimos, qaytadan yuboring.');
      return;
    }

    const { draftId, userId } = ctx.scene.session;
    try {
      const buffer = await downloadTelegramPhoto(ctx.telegram, largest.file_id);
      await this.listings.addImageBuffer(draftId!, userId!, buffer);
    } catch (error) {
      // e.g. the 10-image cap — surface the service's Uzbek message, stay on step.
      await ctx.reply(toUserMessage(error));
      return;
    }

    const count = (ctx.scene.session.imageCount ?? 0) + 1;
    ctx.scene.session.imageCount = count;
    await ctx.reply(
      `Qabul qilindi. Jami: ${count} ta rasm (ko‘pi bilan ${MAX_IMAGES} ta).`,
      this.doneKeyboard(),
    );
  }

  // Registered before @On('text') so the command-scan order catches `/tayyor`
  // before the catch-all text handler can consume it.
  @Command('tayyor')
  async onDoneCommand(@Ctx() ctx: BotContext) {
    if (!this.hasDraft(ctx)) return this.restart(ctx);
    await this.finishPhotos(ctx);
  }

  @Action(DONE_ACTION)
  async onDoneButton(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    if (!this.hasDraft(ctx)) return this.restart(ctx);
    await this.finishPhotos(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    if (!this.hasDraft(ctx)) return this.restart(ctx);

    const step = ctx.scene.session.step;
    const raw = messageText(ctx);
    // Slash-commands are handled by their own @Command listeners; never treat one
    // as field input.
    if (raw.startsWith('/')) return;

    switch (step) {
      case 'address':
        return this.onAddress(ctx, raw);
      case 'landmark':
        return this.onLandmark(ctx, raw);
      case 'rooms':
        return this.onRooms(ctx, raw);
      case 'area':
        return this.onArea(ctx, raw);
      case 'floor':
        return this.onFloor(ctx, raw);
      case 'title':
        return this.onTitle(ctx, raw);
      case 'description':
        return this.onDescription(ctx, raw);
      case 'price':
        return this.onPrice(ctx, raw);
      case 'photos':
        await ctx.reply(
          "Rasm(lar) yuboring, tugagach 'Tayyor ✅' tugmasini bosing.",
          this.doneKeyboard(),
        );
        return;
      default:
        await ctx.reply('Iltimos, yuqoridagi tugmalardan foydalaning.');
        return;
    }
  }

  private async onAddress(ctx: BotContext, raw: string) {
    const address = raw.trim();
    if (address.length < MIN_ADDRESS_LEN) {
      await ctx.reply('Manzil juda qisqa. To‘liqroq manzil kiriting:');
      return;
    }
    if (!(await this.applyPatch(ctx, { address }))) return;
    ctx.scene.session.step = 'landmark';
    await ctx.reply('Mo‘ljalni kiriting (masalan: metro yonida):');
  }

  private async onLandmark(ctx: BotContext, raw: string) {
    const landmark = raw.trim();
    if (landmark.length < MIN_LANDMARK_LEN) {
      await ctx.reply('Mo‘ljal juda qisqa. Qaytadan kiriting:');
      return;
    }
    if (!(await this.applyPatch(ctx, { landmark }))) return;

    // Commercial objects have no room count — record null and skip to area.
    if (ctx.scene.session.type === 'COMMERCIAL') {
      if (!(await this.applyPatch(ctx, { rooms: null }))) return;
      ctx.scene.session.step = 'area';
      await ctx.reply('Maydonni kiriting (m², masalan 65):');
      return;
    }
    ctx.scene.session.step = 'rooms';
    await ctx.reply('Xonalar sonini kiriting (raqam bilan, masalan 3):');
  }

  private async onRooms(ctx: BotContext, raw: string) {
    const rooms = Number(raw.trim());
    if (!Number.isInteger(rooms) || rooms < 1 || rooms > MAX_ROOMS) {
      await ctx.reply(`Iltimos, xonalar sonini 1 dan ${MAX_ROOMS} gacha raqam bilan kiriting.`);
      return;
    }
    if (!(await this.applyPatch(ctx, { rooms }))) return;
    ctx.scene.session.step = 'area';
    await ctx.reply('Maydonni kiriting (m², masalan 65):');
  }

  private async onArea(ctx: BotContext, raw: string) {
    const areaM2 = Number(raw.trim().replace(',', '.'));
    if (!Number.isFinite(areaM2) || areaM2 <= 0 || areaM2 > MAX_AREA_M2) {
      await ctx.reply('Iltimos, maydonni musbat raqam bilan kiriting (masalan 65).');
      return;
    }
    if (!(await this.applyPatch(ctx, { areaM2 }))) return;

    // Houses have no floor number — record null and skip straight to photos.
    if (ctx.scene.session.type === 'HOUSE') {
      if (!(await this.applyPatch(ctx, { floor: null }))) return;
      ctx.scene.session.step = 'photos';
      await this.askPhotos(ctx);
      return;
    }
    ctx.scene.session.step = 'floor';
    await ctx.reply('Qavatni kiriting (masalan: 5/9):');
  }

  private async onFloor(ctx: BotContext, raw: string) {
    const floor = raw.trim();
    if (floor.length < 1) {
      await ctx.reply('Qavatni kiriting (masalan: 5/9):');
      return;
    }
    if (!(await this.applyPatch(ctx, { floor }))) return;
    ctx.scene.session.step = 'photos';
    await this.askPhotos(ctx);
  }

  private async onTitle(ctx: BotContext, raw: string) {
    const title = raw.trim();
    if (title.length < MIN_TITLE_LEN || title.length > MAX_TITLE_LEN) {
      await ctx.reply(
        `Sarlavha ${MIN_TITLE_LEN}–${MAX_TITLE_LEN} belgidan iborat bo‘lsin. Qaytadan kiriting:`,
      );
      return;
    }
    if (!(await this.applyPatch(ctx, { title }))) return;
    ctx.scene.session.step = 'description';
    await ctx.reply('To‘liq tavsifni kiriting (kamida 20 belgi):');
  }

  private async onDescription(ctx: BotContext, raw: string) {
    const description = raw.trim();
    if (description.length < MIN_DESCRIPTION_LEN || description.length > MAX_DESCRIPTION_LEN) {
      await ctx.reply(
        `Tavsif ${MIN_DESCRIPTION_LEN}–${MAX_DESCRIPTION_LEN} belgidan iborat bo‘lsin. Qaytadan kiriting:`,
      );
      return;
    }
    if (!(await this.applyPatch(ctx, { description }))) return;
    ctx.scene.session.step = 'price';
    await ctx.reply('Narxni so‘mda kiriting (faqat raqam, masalan 480000000):');
  }

  private async onPrice(ctx: BotContext, raw: string) {
    // updateDraft feeds this straight into BigInt(), which throws on anything
    // non-numeric, so validate to a bare digit string before storing it.
    const digits = raw.trim().replace(/[\s.,']/g, '');
    const normalized = digits.replace(/^0+/, '');
    if (!/^\d+$/.test(digits) || normalized.length === 0) {
      await ctx.reply('Iltimos, narxni faqat raqam bilan kiriting (masalan 480000000).');
      return;
    }
    if (!(await this.applyPatch(ctx, { priceSom: normalized }))) return;

    // priceUsd is derived server-side inside submitForModeration — the bot never sets it.
    const { draftId, userId } = ctx.scene.session;
    try {
      await this.listings.submitForModeration(draftId!, userId!);
    } catch (error) {
      await ctx.reply(toUserMessage(error));
      await ctx.scene.leave();
      return;
    }

    const deal = ctx.scene.session.deal ?? 'SALE';
    await ctx.reply(
      [
        "E'loningiz moderatsiyaga yuborildi ✅",
        `💰 Narx: ${formatPriceSom(normalized, deal)}`,
      ].join('\n'),
    );
    await ctx.scene.leave();
  }

  /** Advance past the photo step; requires at least one uploaded image. */
  private async finishPhotos(ctx: BotContext) {
    if (ctx.scene.session.step !== 'photos') return;
    if ((ctx.scene.session.imageCount ?? 0) < 1) {
      await ctx.reply('Kamida bitta rasm yuklang.', this.doneKeyboard());
      return;
    }
    ctx.scene.session.step = 'title';
    await ctx.reply("E'lon sarlavhasini kiriting (10–120 belgi):");
  }

  private async askPhotos(ctx: BotContext) {
    await ctx.reply(
      "Rasm(lar) yuboring, tugagach 'Tayyor ✅' tugmasini bosing (kamida 1 ta, ko‘pi bilan 10 ta).",
      this.doneKeyboard(),
    );
  }

  private doneKeyboard() {
    return Markup.inlineKeyboard([[Markup.button.callback('Tayyor ✅', DONE_ACTION)]]);
  }

  /** True once onEnter has stashed the draft — guards handlers against a lost session. */
  private hasDraft(ctx: BotContext): boolean {
    return Boolean(ctx.scene.session.draftId && ctx.scene.session.userId);
  }

  private async restart(ctx: BotContext) {
    await ctx.reply('Sessiya topilmadi. /start bilan qaytadan boshlang.');
    await ctx.scene.leave();
  }

  /**
   * Persist one field, surfacing a service error (BadRequestException /
   * NotFoundException) as a user reply instead of throwing. Returns false when
   * the patch failed so callers can abort the step transition.
   */
  private async applyPatch(ctx: BotContext, patch: Record<string, unknown>): Promise<boolean> {
    const { draftId, userId } = ctx.scene.session;
    if (!draftId || !userId) {
      await this.restart(ctx);
      return false;
    }
    try {
      await this.listings.updateDraft(draftId, userId, patch);
      return true;
    } catch (error) {
      await ctx.reply(toUserMessage(error));
      return false;
    }
  }
}
