import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  formatListedAt,
  RealtorSlugSchema,
  type PublicReview,
  type RealtorProfileUpdate,
} from '@rieltor/shared';
import { useMyRating, useProfile, useSaveLogo, useSaveProfile } from '@/features/profile';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { RatingStars } from '@/shared/ui/rating-stars';

/**
 * The regions a realtor can select as their coverage area. Defined locally because
 * there is no shared region constant in the monorepo; the 14 entries match the
 * `regions` schema bound (array max 14, each item min 2 chars), so any subset is a
 * valid `RealtorProfileUpdate.regions`.
 */
const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Buxoro',
  'Andijon',
  "Farg'ona",
  'Namangan',
  'Navoiy',
  'Qashqadaryo',
  'Surxondaryo',
  'Xorazm',
  'Jizzax',
  'Sirdaryo',
  "Qoraqalpog'iston",
] as const;

const AGENCY_MIN = 2;
const AGENCY_MAX = 80;
const BIO_MAX = 1000;
const EXPERIENCE_MIN = 0;
const EXPERIENCE_MAX = 70;
const SLUG_MAX = 40;

/** Fallback swatch for `<input type="color">` when the realtor hasn't picked a brand colour. */
const DEFAULT_BRAND_COLOR = '#7c3aed';

/** Logo upload limits — mirror the server (ProfileLogoController): jpeg/png/webp, ≤ 10 MB. */
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_SIZE_BYTES = 10 * 1024 * 1024;

/** Same-membership check for two region lists (order is stable, from the constant). */
function sameRegions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((region, i) => region === b[i]);
}

/** One APPROVED review as it appears in the realtor's own "Baholarim" list. Read-only:
 * a realtor sees the same public reviews buyers do but cannot moderate or reply here. */
function ReviewRow({ review }: { review: PublicReview }) {
  return (
    <li className="rounded-[12px] border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        {review.authorPhotoUrl ? (
          <img
            src={review.authorPhotoUrl}
            alt={review.authorName}
            loading="lazy"
            decoding="async"
            className="size-9 shrink-0 rounded-full bg-accent-soft object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[14px] font-extrabold text-accent">
            {review.authorName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">{review.authorName}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <RatingStars value={review.rating} />
            <span className="text-[12px] font-medium text-ink-3">
              {formatListedAt(review.createdAt.slice(0, 10))}
            </span>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-2 text-[13px] leading-[1.55] font-medium text-ink-2">{review.comment}</p>
      )}
    </li>
  );
}

/** "Baholarim" — a read-only mirror of the realtor's public rating + APPROVED reviews,
 * fetched from their own `GET /api/r/:slug`. Only mounted once a slug is set (see the
 * caller), so `slug` is always a real, published page here. */
function MyRatingSection({ slug }: { slug: string }) {
  const { data, isPending, isError } = useMyRating(slug);

  return (
    <section className="rounded-card bg-card p-4 shadow-card">
      <p className="text-[13px] font-bold text-ink">Baholarim</p>

      {isPending ? (
        <p className="mt-2 text-[13px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !data ? (
        <p className="mt-2 text-[13px] font-semibold text-brand-rose">
          Baholarni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RatingStars value={data.ratingAvg ?? 0} />
            <span className="text-[13px] font-semibold text-ink-2">
              {data.ratingCount > 0 && data.ratingAvg !== null
                ? `${data.ratingAvg.toFixed(1)} · ${data.ratingCount} ta sharh`
                : "Hali baholar yo'q"}
            </span>
          </div>

          {data.reviews.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {data.reviews.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/**
 * The realtor's editable profile. Loads the current values from
 * `GET /api/agent/profile` (which returns all-defaults for a realtor who has never
 * saved — handled the same as any other value), lets the realtor edit their
 * profile plus branding (slug, brand colour, logo), and PATCHes only the fields
 * that actually changed so the all-optional update never carries a field the
 * schema would reject. The logo is a separate multipart upload endpoint. Below the
 * editor, a read-only "Baholarim" section mirrors the public rating + reviews.
 */
export function ProfilePage() {
  const { data: profile, isPending, isError } = useProfile();
  const save = useSaveProfile();
  const saveLogo = useSaveLogo();

  const [agency, setAgency] = useState('');
  const [bio, setBio] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  // Kept as a string so the field can be blank (→ null on save) rather than 0.
  const [experienceYears, setExperienceYears] = useState('');
  // Editable slug input; '' means "no public page" (→ null on save, unpublishing).
  const [slug, setSlug] = useState('');
  // Editable brand colour; '' means "app default" (→ null on save). The colour
  // input always yields a "#rrggbb" value, so any non-empty value is a valid hex.
  const [brandColor, setBrandColor] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed the form from the server profile exactly once. A guard (rather than a
  // plain [profile] dependency) keeps a later background refetch — or the cache
  // reseed after a successful save (or logo upload) — from clobbering in-progress
  // edits. logoUrl/verified are read straight from `profile` (server truth, always
  // fresh after an upload), so only the locally-edited fields are seeded here.
  const seeded = useRef(false);
  useEffect(() => {
    if (!profile || seeded.current) return;
    seeded.current = true;
    setAgency(profile.agency);
    setBio(profile.bio ?? '');
    setRegions(profile.regions);
    setExperienceYears(profile.experienceYears === null ? '' : String(profile.experienceYears));
    setSlug(profile.slug ?? '');
    setBrandColor(profile.brandColor ?? '');
  }, [profile]);

  // Any edit invalidates the last "saved" confirmation.
  function markDirty() {
    if (saved) setSaved(false);
    if (validationError) setValidationError(null);
  }

  function toggleRegion(region: string) {
    markDirty();
    setRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : // Re-derive from the constant so the stored order is always stable.
          UZBEKISTAN_REGIONS.filter((r) => r === region || prev.includes(r)),
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;

    const trimmedAgency = agency.trim();
    // agency is required (min 2) — enforced as a precondition for saving at all.
    if (trimmedAgency.length < AGENCY_MIN) {
      setValidationError('Agentlik nomini kiriting (kamida 2 belgi).');
      return;
    }

    const trimmedExperience = experienceYears.trim();
    let nextExperience: number | null = null;
    if (trimmedExperience !== '') {
      const parsed = Number(trimmedExperience);
      if (!Number.isInteger(parsed) || parsed < EXPERIENCE_MIN || parsed > EXPERIENCE_MAX) {
        setValidationError(
          `Tajriba ${EXPERIENCE_MIN}–${EXPERIENCE_MAX} yil oralig'ida bo'lishi kerak.`,
        );
        return;
      }
      nextExperience = parsed;
    }

    const nextBio = bio.trim() === '' ? null : bio;

    // slug: '' unpublishes (→ null); otherwise it must match RealtorSlugSchema —
    // validated with the shared schema itself so the client rule can never drift
    // from the server's (lowercase kebab, 3–40 chars, no leading/trailing dash).
    const trimmedSlug = slug.trim();
    const nextSlug = trimmedSlug === '' ? null : trimmedSlug;
    if (nextSlug !== null && !RealtorSlugSchema.safeParse(nextSlug).success) {
      setValidationError('Faqat kichik lotin harflari, raqamlar va tire; 3–40 belgi.');
      return;
    }

    // brandColor: '' means "app default" (→ null); a picked colour is always "#rrggbb".
    const nextBrandColor = brandColor === '' ? null : brandColor;

    // Build the patch from changed fields only: an all-optional PATCH must never
    // carry a field the schema could reject, and unchanged fields need no write.
    const patch: RealtorProfileUpdate = {};
    if (trimmedAgency !== profile.agency) patch.agency = trimmedAgency;
    if (nextBio !== profile.bio) patch.bio = nextBio;
    if (!sameRegions(regions, profile.regions)) patch.regions = regions;
    if (nextExperience !== profile.experienceYears) patch.experienceYears = nextExperience;
    if (nextSlug !== profile.slug) patch.slug = nextSlug;
    if (nextBrandColor !== profile.brandColor) patch.brandColor = nextBrandColor;

    setValidationError(null);

    // Nothing changed — no request; the stored profile already matches the form.
    if (Object.keys(patch).length === 0) {
      setSaved(true);
      return;
    }

    save.mutate(patch, { onSuccess: () => setSaved(true) });
  }

  // Validate client-side (mirror the server's mime/size gate) then upload. The
  // input is reset so the same file can be re-picked after a rejected attempt.
  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setLogoError(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Faqat JPEG, PNG yoki WebP formatidagi rasm qabul qilinadi.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError('Rasm hajmi 10 MB dan oshmasligi kerak.');
      return;
    }

    saveLogo.mutate(file);
  }

  // slug/brandColor server rejections (400 "band" / 409 "olingan") carry a
  // ready-to-show Uzbek message; surface it verbatim. Any other failure keeps the
  // generic copy so an unexpected 500 doesn't leak an internal string.
  const saveErrorMessage =
    save.error instanceof ApiError && (save.error.status === 400 || save.error.status === 409)
      ? save.error.message
      : "Saqlashda xatolik. Qayta urinib ko'ring.";

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Profil</h1>
      </header>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Profilni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* public page — uses the SERVER-persisted slug so the link only shows once published */}
            <section className="rounded-card bg-card p-4 shadow-card">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold text-ink">Ommaviy sahifangiz</p>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-dark">
                    <Icon name="check" className="size-3.5" />
                    Tasdiqlangan
                  </span>
                )}
              </div>
              {profile.slug ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={`${window.location.origin}/r/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-[14px] font-semibold text-accent underline"
                  >
                    {`${window.location.origin}/r/${profile.slug}`}
                  </a>
                  <a
                    href={`${window.location.origin}/r/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2"
                  >
                    <Icon name="share" className="size-4" />
                    Ochish
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-[13px] text-ink-3">
                  Ommaviy sahifangizni chop etish uchun manzil (slug) belgilang.
                </p>
              )}
            </section>

            {/* agency */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <label htmlFor="agency" className="text-[13px] font-bold text-ink">
                Agentlik / brend nomi
              </label>
              <input
                id="agency"
                type="text"
                value={agency}
                onChange={(e) => {
                  markDirty();
                  setAgency(e.target.value);
                }}
                maxLength={AGENCY_MAX}
                required
                placeholder="Masalan: Uysot Realty"
                className="mt-2 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
              />
            </div>

            {/* bio */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <label htmlFor="bio" className="text-[13px] font-bold text-ink">
                O'zingiz haqingizda
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  markDirty();
                  setBio(e.target.value);
                }}
                maxLength={BIO_MAX}
                rows={4}
                placeholder="Tajribangiz, mutaxassisligingiz haqida qisqacha..."
                className="mt-2 w-full resize-y rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
              />
              <p className="mt-1 text-right text-[11px] font-medium text-ink-3">
                {bio.length}/{BIO_MAX}
              </p>
            </div>

            {/* regions */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <p className="text-[13px] font-bold text-ink">Faoliyat hududlari</p>
              <p className="mt-1 text-[12px] text-ink-3">Bir nechtasini tanlashingiz mumkin.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {UZBEKISTAN_REGIONS.map((region) => {
                  const active = regions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      aria-pressed={active}
                      className={
                        active
                          ? 'rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-white'
                          : 'rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2'
                      }
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* experienceYears */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <label htmlFor="experienceYears" className="text-[13px] font-bold text-ink">
                Tajriba (yil)
              </label>
              <input
                id="experienceYears"
                type="number"
                inputMode="numeric"
                value={experienceYears}
                onChange={(e) => {
                  markDirty();
                  setExperienceYears(e.target.value);
                }}
                min={EXPERIENCE_MIN}
                max={EXPERIENCE_MAX}
                placeholder="Masalan: 5"
                className="mt-2 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
              />
            </div>

            {/* slug */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <label htmlFor="slug" className="text-[13px] font-bold text-ink">
                Sahifa manzili (slug)
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  markDirty();
                  // Nudge toward a valid slug: lowercase and strip spaces as typed.
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, ''));
                }}
                maxLength={SLUG_MAX}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="masalan: uysot-realty"
                className="mt-2 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
              />
              <p className="mt-1.5 text-[12px] text-ink-3">
                Sizning sahifangiz:{' '}
                <span className="font-semibold text-ink-2">/r/{slug || '...'}</span>
              </p>
            </div>

            {/* brandColor */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <p className="text-[13px] font-bold text-ink">Brend rangi</p>
              <p className="mt-1 text-[12px] text-ink-3">Ommaviy sahifangiz uchun asosiy rang.</p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="brandColor"
                  type="color"
                  value={brandColor || DEFAULT_BRAND_COLOR}
                  onChange={(e) => {
                    markDirty();
                    setBrandColor(e.target.value);
                  }}
                  aria-label="Brend rangi"
                  className="size-10 shrink-0 cursor-pointer rounded-[10px] border border-line bg-surface"
                />
                <span className="text-[14px] font-semibold text-ink-2">
                  {brandColor || 'Standart rang'}
                </span>
                {brandColor !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      markDirty();
                      setBrandColor('');
                    }}
                    className="ml-auto rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2"
                  >
                    Tozalash
                  </button>
                )}
              </div>
            </div>

            {/* logo */}
            <div className="rounded-card bg-card p-4 shadow-card">
              <p className="text-[13px] font-bold text-ink">Logotip</p>
              <p className="mt-1 text-[12px] text-ink-3">JPEG, PNG yoki WebP; 10 MB gacha.</p>
              <div className="mt-3 flex items-center gap-3">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Joriy logotip"
                    className="size-14 shrink-0 rounded-[12px] border border-line object-cover"
                  />
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[12px] border border-dashed border-line text-ink-3">
                    <Icon name="camera" className="size-5" />
                  </div>
                )}
                <label className="cursor-pointer rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-2">
                  {saveLogo.isPending
                    ? 'Yuklanmoqda...'
                    : profile.logoUrl
                      ? 'Almashtirish'
                      : 'Yuklash'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    disabled={saveLogo.isPending}
                    className="hidden"
                  />
                </label>
              </div>
              {logoError && (
                <p className="mt-2 text-[13px] font-semibold text-brand-rose">{logoError}</p>
              )}
              {saveLogo.isError && !logoError && (
                <p className="mt-2 text-[13px] font-semibold text-brand-rose">
                  {saveLogo.error instanceof ApiError
                    ? saveLogo.error.message
                    : "Logotipni yuklab bo'lmadi. Qayta urinib ko'ring."}
                </p>
              )}
            </div>

            {validationError && (
              <p className="text-[13px] font-semibold text-brand-rose">{validationError}</p>
            )}

            {save.isError && (
              <p className="text-[13px] font-semibold text-brand-rose">{saveErrorMessage}</p>
            )}

            {saved && !save.isPending && (
              <p className="flex items-center gap-1.5 rounded-[12px] bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent-dark">
                <Icon name="check" className="size-4" />
                Profil saqlandi.
              </p>
            )}

            <button
              type="submit"
              disabled={save.isPending}
              className="w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
            >
              {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>

          {/* ratings — read-only mirror of the public rating; only shown once a slug is
              published (an unpublished realtor has no `/api/r/:slug` to read). */}
          {profile.slug ? (
            <MyRatingSection slug={profile.slug} />
          ) : (
            <section className="rounded-card bg-card p-4 shadow-card">
              <p className="text-[13px] font-bold text-ink">Baholarim</p>
              <p className="mt-2 text-[13px] text-ink-3">
                Ommaviy sahifangizni (slug) belgilang — shundan so'ng baholar ko'rinadi.
              </p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
