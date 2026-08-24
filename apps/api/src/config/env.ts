import * as z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  /**
   * Used to build an absolute og:image URL. Telegram does not follow relative
   * paths (spec §8). A trailing slash is stripped so `${PUBLIC_BASE_URL}/images/...`
   * concatenates cleanly.
   */
  PUBLIC_BASE_URL: z.url().transform((v) => v.replace(/\/+$/, '')),
  /** Output of the Vite build. Tests and Docker may point this elsewhere. */
  WEB_DIST: z.string().optional(),
  /** Signs access tokens (see auth/token.service.ts). */
  JWT_SECRET: z.string().min(32),
  /**
   * Verifies the Telegram Login widget's HMAC signature (see auth/auth.service.ts).
   * non-empty — an empty token makes the HMAC secret forgeable
   */
  TELEGRAM_BOT_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
