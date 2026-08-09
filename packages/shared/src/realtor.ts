import * as z from 'zod';

/** +998 and nine digits, no spaces — the format tel: links need. */
export const UZ_PHONE_PATTERN = /^\+998\d{9}$/;

/** Slug used in /r/:username. */
export const USERNAME_PATTERN = /^[a-z0-9-]{3,30}$/;

export const PhoneSchema = z
  .string()
  .regex(UZ_PHONE_PATTERN, "Telefon +998XXXXXXXXX ko'rinishida bo'lishi kerak");

/**
 * What the Telegram Login Widget hands to the browser. Every value arrives as a
 * string in the widget's redirect form, so the numeric fields are coerced.
 */
export const TelegramAuthSchema = z.object({
  id: z.coerce.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.coerce.number().int().positive(),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
});

/** What /api/me returns — never includes tgId or anything secret. */
export const RealtorProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  photoUrl: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean(),
  agency: z.string().nullable(),
  registryNo: z.string().nullable(),
  trusted: z.boolean(),
});

/**
 * PATCH /api/me body. Every field is optional; `null` clears the text fields the
 * profile can live without. `phone` cannot be cleared — publishing depends on it.
 */
export const RealtorProfileUpdateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: PhoneSchema.optional(),
  agency: z.string().max(80).nullable().optional(),
  registryNo: z.string().max(40).nullable().optional(),
});

const USERNAME_FALLBACK = 'rieltor';
const USERNAME_MAX = 30;

/**
 * Turns a Telegram username or display name into a URL slug. Anything outside
 * [a-z0-9] becomes a dash; a source with no usable characters (Cyrillic, emoji)
 * falls back to a fixed stem that the caller then makes unique.
 */
export function slugifyUsername(source: string): string {
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USERNAME_MAX)
    .replace(/-+$/g, '');

  return slug.length >= 3 ? slug : USERNAME_FALLBACK;
}

export type TelegramAuth = z.infer<typeof TelegramAuthSchema>;
export type RealtorProfile = z.infer<typeof RealtorProfileSchema>;
export type RealtorProfileUpdate = z.infer<typeof RealtorProfileUpdateSchema>;
