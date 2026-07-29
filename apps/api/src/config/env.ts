import * as z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  /**
   * Absolyut og:image URL'i uchun. Telegram nisbiy yo'lni o'qimaydi (spec §8).
   * Oxiridagi slash olib tashlanadi — keyin `${PUBLIC_BASE_URL}/images/...` deb ulanadi.
   */
  PUBLIC_BASE_URL: z.url().transform((v) => v.replace(/\/+$/, '')),
  /** Vite build natijasi. Test va Docker'da boshqa yo'l berilishi mumkin. */
  WEB_DIST: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
