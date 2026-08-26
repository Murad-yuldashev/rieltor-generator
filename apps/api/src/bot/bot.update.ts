import { Action, Ctx, Start, Update } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { mainMenu } from './bot.keyboards';

// SceneContext types `ctx.scene`, which the menu actions enter. The Stage that
// registers those scenes is wired in Tasks 6-8; until then the bot is dormant,
// so no update is ever processed.
type BotCtx = Scenes.SceneContext;

@Update()
export class BotUpdate {
  @Start()
  async start(@Ctx() ctx: BotCtx) {
    await ctx.reply('Assalomu alaykum! RieltorApp botiga xush kelibsiz. Nima qilamiz?', mainMenu);
  }

  @Action('menu:valuation')
  async onValuation(@Ctx() ctx: BotCtx) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('valuation');
  }

  @Action('menu:listing')
  async onListing(@Ctx() ctx: BotCtx) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('listing');
  }

  @Action('menu:mine')
  async onMine(@Ctx() ctx: BotCtx) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('mine');
  }
}
