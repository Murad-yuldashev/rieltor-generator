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
  /**
   * Cabinet variables. All optional on purpose: without them the public site works
   * exactly as before and only the realtor cabinet turns itself off (spec §7.3).
   */
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  /** Signs the session cookie. Without it /api/auth/* answers 503. */
  JWT_SECRET: z.string().min(16).optional(),
  /** Guards the admin endpoints (stage 2 onwards). */
  ADMIN_TOKEN: z.string().min(16).optional(),
  /** Enables POST /api/auth/dev — ignored when NODE_ENV is production. */
  DEV_LOGIN_SECRET: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;
