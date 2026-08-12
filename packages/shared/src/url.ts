/**
 * Turns a possibly-relative URL into an absolute one. Telegram (and most link
 * unfurlers) do not follow relative og:image paths, so the SSR meta tags and the
 * stage-2b media pipeline both need this (design spec §6.3). Already-absolute
 * URLs — e.g. a future R2 `https://media.example.com/...` — pass through unchanged.
 */
export function absoluteUrl(baseUrl: string, url: string): string {
  return url.startsWith('http') ? url : `${baseUrl}${url}`;
}
