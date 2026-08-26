import type { Telegram } from 'telegraf';

/** Resolve a Telegram file_id to its bytes (for the sharp pipeline). */
export async function downloadTelegramPhoto(telegram: Telegram, fileId: string): Promise<Buffer> {
  const link = await telegram.getFileLink(fileId);
  const res = await fetch(link.toString());
  if (!res.ok) throw new Error(`Telegram file fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
