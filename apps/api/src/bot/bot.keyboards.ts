import { Markup } from 'telegraf';

export const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🏡 Uyni baholash', 'menu:valuation')],
  [Markup.button.callback("➕ E'lon joylash", 'menu:listing')],
  [Markup.button.callback("📋 Mening e'lonlarim", 'menu:mine')],
]);
