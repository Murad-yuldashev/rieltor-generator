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
  /**
   * Turns the cabinet into an open, login-free demo: every request behind RealtorGuard
   * is authenticated as one shared demo realtor, and the login screen never shows. Off
   * by default — set DEMO_MODE=true only on a throwaway demo deploy, since it removes
   * the login wall entirely (unlike DEV_LOGIN_SECRET this is honoured in production too).
   */
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  /** Guards POST /api/internal/cron/daily (stage 4, spec §7.5). 503 if unset. */
  CRON_SECRET: z.string().min(16).optional(),
  /**
   * Salts Event.ipHash (stage 3, spec §8.2) so a raw IP is never stored. Optional:
   * unset does not disable analytics, it just hashes without a secret — a weaker
   * but still-working default (the project's usual "degrade, don't crash" rule).
   */
  IP_HASH_SECRET: z.string().optional(),
  /**
   * Cloudflare R2 (S3-compatible) object storage for uploaded listing photos
   * (stage 2b, spec §6.1). All five are optional: unset means createMediaStorage()
   * falls back to LocalDiskStorage and the media module still registers and works.
   */
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  /** Public base URL images are served from once R2 is live, e.g. https://media.example.com. */
  MEDIA_PUBLIC_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
