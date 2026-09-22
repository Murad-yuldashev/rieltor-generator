import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { RealtorSlugSchema, type RealtorProfileUpdate } from '@rieltor/shared';
import * as z from 'zod';
import { useSession } from '@/entities/session';
import { useProfile, useSaveCover, useSaveLogo, useSaveProfile } from '@/features/profile';
import { useSubscription } from '@/features/subscription';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ProfilePreview } from './profile-preview';
import { RatingsPanel } from './ratings-panel';

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
// Phase 9 site-config field maxima — mirror RealtorProfileUpdateSchema.
const TAGLINE_MAX = 120;
const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 200;

/** Fallback swatch for `<input type="color">` when the realtor hasn't picked a brand colour. */
const DEFAULT_BRAND_COLOR = '#7c3aed';

/** Logo/cover upload limits — mirror the server (ProfileLogoController): jpeg/png/webp, ≤ 10 MB. */
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * instagramUrl/telegramChannelUrl must be full URLs. Validated with the same
 * `z.url().max(200)` rule the server enforces so the client message never drifts
 * from the server contract.
 */
const SiteUrlSchema = z.url().max(200);

/** Same-membership check for two region lists (order is stable, from the constant). */
function sameRegions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((region, i) => region === b[i]);
}

/**
 * The realtor's editable profile. Loads the current values from
 * `GET /api/agent/profile` (which returns all-defaults for a realtor who has never
 * saved — handled the same as any other value), lets the realtor edit their
 * profile plus branding (slug, brand colour, logo), and PATCHes only the fields
 * that actually changed so the all-optional update never carries a field the
 * schema would reject. The logo is a separate multipart upload endpoint. On desktop
 * the editor is the MAIN column of a two-column band; a sticky ASIDE mirrors the
 * public preview and a read-only "Baholarim" (rating + reviews) panel.
 */
export function ProfilePage() {
  const { data: profile, isPending, isError } = useProfile();
  const { data: subscription } = useSubscription();
  const { user } = useSession();
  const save = useSaveProfile();
  const saveLogo = useSaveLogo();
  const saveCover = useSaveCover();

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
  // Phase 9 site-config fields — all kept as strings ('' → null on save).
  const [tagline, setTagline] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactTelegram, setContactTelegram] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [telegramChannelUrl, setTelegramChannelUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  // Whether the public microsite is published; defaults to true server-side.
  const [sitePublished, setSitePublished] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
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
    setTagline(profile.tagline ?? '');
    setContactPhone(profile.contactPhone ?? '');
    setContactWhatsapp(profile.contactWhatsapp ?? '');
    setContactTelegram(profile.contactTelegram ?? '');
    setInstagramUrl(profile.instagramUrl ?? '');
    setTelegramChannelUrl(profile.telegramChannelUrl ?? '');
    setSeoTitle(profile.seoTitle ?? '');
    setSeoDescription(profile.seoDescription ?? '');
    setSitePublished(profile.sitePublished);
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

    // Phase 9 site-config fields. Empty string → null. Phones are NOT canonicalized
    // here — the schema's ContactPhoneSchema.transform does it server-side. The
    // Telegram username loses a leading '@' (the schema strips it too, but doing it
    // here keeps the changed-field diff honest against the stored, '@'-less value).
    const nextTagline = tagline.trim() === '' ? null : tagline.trim();
    const nextContactPhone = contactPhone.trim() === '' ? null : contactPhone.trim();
    const nextContactWhatsapp = contactWhatsapp.trim() === '' ? null : contactWhatsapp.trim();
    const strippedTelegram = contactTelegram.trim().replace(/^@/, '');
    const nextContactTelegram = strippedTelegram === '' ? null : strippedTelegram;
    const nextInstagramUrl = instagramUrl.trim() === '' ? null : instagramUrl.trim();
    const nextTelegramChannelUrl =
      telegramChannelUrl.trim() === '' ? null : telegramChannelUrl.trim();
    const nextSeoTitle = seoTitle.trim() === '' ? null : seoTitle.trim();
    const nextSeoDescription = seoDescription.trim() === '' ? null : seoDescription.trim();

    // instagramUrl/telegramChannelUrl must be full URLs — validated with the same
    // z.url() rule the server enforces, so the client never sends a value the
    // schema would 400 on.
    if (nextInstagramUrl !== null && !SiteUrlSchema.safeParse(nextInstagramUrl).success) {
      setValidationError(
        "Instagram havolasi to'liq URL bo'lishi kerak (masalan, https://instagram.com/...).",
      );
      return;
    }
    if (
      nextTelegramChannelUrl !== null &&
      !SiteUrlSchema.safeParse(nextTelegramChannelUrl).success
    ) {
      setValidationError(
        "Telegram kanal havolasi to'liq URL bo'lishi kerak (masalan, https://t.me/...).",
      );
      return;
    }

    // Build the patch from changed fields only: an all-optional PATCH must never
    // carry a field the schema could reject, and unchanged fields need no write.
    const patch: RealtorProfileUpdate = {};
    if (trimmedAgency !== profile.agency) patch.agency = trimmedAgency;
    if (nextBio !== profile.bio) patch.bio = nextBio;
    if (!sameRegions(regions, profile.regions)) patch.regions = regions;
    if (nextExperience !== profile.experienceYears) patch.experienceYears = nextExperience;
    if (nextSlug !== profile.slug) patch.slug = nextSlug;
    if (nextBrandColor !== profile.brandColor) patch.brandColor = nextBrandColor;
    if (nextTagline !== profile.tagline) patch.tagline = nextTagline;
    if (nextContactPhone !== profile.contactPhone) patch.contactPhone = nextContactPhone;
    if (nextContactWhatsapp !== profile.contactWhatsapp)
      patch.contactWhatsapp = nextContactWhatsapp;
    if (nextContactTelegram !== profile.contactTelegram)
      patch.contactTelegram = nextContactTelegram;
    if (nextInstagramUrl !== profile.instagramUrl) patch.instagramUrl = nextInstagramUrl;
    if (nextTelegramChannelUrl !== profile.telegramChannelUrl) {
      patch.telegramChannelUrl = nextTelegramChannelUrl;
    }
    if (nextSeoTitle !== profile.seoTitle) patch.seoTitle = nextSeoTitle;
    if (nextSeoDescription !== profile.seoDescription) patch.seoDescription = nextSeoDescription;
    if (sitePublished !== profile.sitePublished) patch.sitePublished = sitePublished;

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

  // Cover upload — mirrors handleLogoChange (same client-side mime/size gate); the
  // server stores the 1200×630 OG crop as coverImageUrl.
  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setCoverError(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setCoverError('Faqat JPEG, PNG yoki WebP formatidagi rasm qabul qilinadi.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setCoverError('Rasm hajmi 10 MB dan oshmasligi kerak.');
      return;
    }

    saveCover.mutate(file);
  }

  // slug/brandColor server rejections (400 "band" / 409 "olingan") carry a
  // ready-to-show Uzbek message; surface it verbatim. Any other failure keeps the
  // generic copy so an unexpected 500 doesn't leak an internal string.
  const saveErrorMessage =
    save.error instanceof ApiError && (save.error.status === 400 || save.error.status === 409)
      ? save.error.message
      : "Saqlashda xatolik. Qayta urinib ko'ring.";

  // The public microsite is truly live only when it is published AND the
  // subscription is active — the /api/r/:slug guard enforces the same, so this
  // reflects what a visitor would actually see.
  const subscriptionActive = Boolean(subscription?.isActive);
  const siteLive = Boolean(profile?.sitePublished) && subscriptionActive;

  return (
    <main>
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Profil</h1>
      </header>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Profilni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6 desk:grid-cols-[1fr_380px]">
          {/* MAIN — the editor form; narrow fields pair into two md columns, wide
              cards span both. */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4"
            noValidate
          >
            {/* public page — uses the SERVER-persisted slug so the link only shows once published */}
            <section className="rounded-card bg-card p-4 shadow-card md:col-span-2">
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
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold',
                      siteLive ? 'bg-accent-soft text-accent-dark' : 'bg-surface text-ink-2',
                    )}
                  >
                    <span
                      className={cn('size-2 rounded-full', siteLive ? 'bg-accent' : 'bg-ink-3')}
                      aria-hidden
                    />
                    {siteLive ? 'Jonli' : 'Pauzada'}
                  </span>
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
              {!subscriptionActive && (
                <p className="mt-2 text-[12px] text-ink-3">
                  Sayt faqat obuna faol bo'lganda ko'rinadi.{' '}
                  <Link to="/subscribe" className="font-semibold text-accent underline">
                    Obunani faollashtirish
                  </Link>
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

            {/* bio */}
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
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
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
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
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
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

            {/* cover — the 1200×630 hero the microsite shows above the header */}
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
              <p className="text-[13px] font-bold text-ink">Muqova rasmi</p>
              <p className="mt-1 text-[12px] text-ink-3">
                Sahifa yuqorisidagi asosiy rasm (1200×630). JPEG, PNG yoki WebP; 10 MB gacha.
              </p>
              <div className="mt-3 flex items-center gap-3">
                {profile.coverImageUrl ? (
                  <img
                    src={profile.coverImageUrl}
                    alt="Joriy muqova"
                    className="h-14 w-28 shrink-0 rounded-[12px] border border-line object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-[12px] border border-dashed border-line text-ink-3">
                    <Icon name="camera" className="size-5" />
                  </div>
                )}
                <label className="cursor-pointer rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-2">
                  {saveCover.isPending
                    ? 'Yuklanmoqda...'
                    : profile.coverImageUrl
                      ? 'Almashtirish'
                      : 'Yuklash'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    disabled={saveCover.isPending}
                    className="hidden"
                  />
                </label>
              </div>
              {coverError && (
                <p className="mt-2 text-[13px] font-semibold text-brand-rose">{coverError}</p>
              )}
              {saveCover.isError && !coverError && (
                <p className="mt-2 text-[13px] font-semibold text-brand-rose">
                  {saveCover.error instanceof ApiError
                    ? saveCover.error.message
                    : "Muqovani yuklab bo'lmadi. Qayta urinib ko'ring."}
                </p>
              )}
            </div>

            {/* tagline */}
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
              <label htmlFor="tagline" className="text-[13px] font-bold text-ink">
                Shior (tagline)
              </label>
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => {
                  markDirty();
                  setTagline(e.target.value);
                }}
                maxLength={TAGLINE_MAX}
                placeholder="Masalan: Toshkentda ishonchli ko'chmas mulk sherigingiz"
                className="mt-2 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
              />
            </div>

            {/* contact */}
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
              <p className="text-[13px] font-bold text-ink">Aloqa ma'lumotlari</p>
              <p className="mt-1 text-[12px] text-ink-3">
                Sahifa mehmonlari siz bilan shu orqali bog'lanadi.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="contactPhone" className="text-[12px] font-semibold text-ink-2">
                    Telefon
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    inputMode="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      markDirty();
                      setContactPhone(e.target.value);
                    }}
                    placeholder="+998 90 123 45 67"
                    className="mt-1.5 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label htmlFor="contactWhatsapp" className="text-[12px] font-semibold text-ink-2">
                    WhatsApp
                  </label>
                  <input
                    id="contactWhatsapp"
                    type="tel"
                    inputMode="tel"
                    value={contactWhatsapp}
                    onChange={(e) => {
                      markDirty();
                      setContactWhatsapp(e.target.value);
                    }}
                    placeholder="+998 90 123 45 67"
                    className="mt-1.5 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label htmlFor="contactTelegram" className="text-[12px] font-semibold text-ink-2">
                    Telegram username
                  </label>
                  <input
                    id="contactTelegram"
                    type="text"
                    value={contactTelegram}
                    onChange={(e) => {
                      markDirty();
                      setContactTelegram(e.target.value);
                    }}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="@username"
                    className="mt-1.5 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="telegramChannelUrl"
                    className="text-[12px] font-semibold text-ink-2"
                  >
                    Telegram kanal havolasi
                  </label>
                  <input
                    id="telegramChannelUrl"
                    type="url"
                    inputMode="url"
                    value={telegramChannelUrl}
                    onChange={(e) => {
                      markDirty();
                      setTelegramChannelUrl(e.target.value);
                    }}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="https://t.me/kanal"
                    className="mt-1.5 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="instagramUrl" className="text-[12px] font-semibold text-ink-2">
                    Instagram havolasi
                  </label>
                  <input
                    id="instagramUrl"
                    type="url"
                    inputMode="url"
                    value={instagramUrl}
                    onChange={(e) => {
                      markDirty();
                      setInstagramUrl(e.target.value);
                    }}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="https://instagram.com/username"
                    className="mt-1.5 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
              <p className="text-[13px] font-bold text-ink">SEO (qidiruv tizimlari uchun)</p>
              <p className="mt-1 text-[12px] text-ink-3">
                Bo'sh qoldirsangiz, sarlavha va tavsif avtomatik tuziladi.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <label htmlFor="seoTitle" className="text-[12px] font-semibold text-ink-2">
                    Sarlavha
                  </label>
                  <input
                    id="seoTitle"
                    type="text"
                    value={seoTitle}
                    onChange={(e) => {
                      markDirty();
                      setSeoTitle(e.target.value);
                    }}
                    maxLength={SEO_TITLE_MAX}
                    placeholder="Masalan: Uysot Realty — Toshkentda ko'chmas mulk"
                    className="mt-1.5 w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                  <p className="mt-1 text-right text-[11px] font-medium text-ink-3">
                    {seoTitle.length}/{SEO_TITLE_MAX}
                  </p>
                </div>
                <div>
                  <label htmlFor="seoDescription" className="text-[12px] font-semibold text-ink-2">
                    Tavsif
                  </label>
                  <textarea
                    id="seoDescription"
                    value={seoDescription}
                    onChange={(e) => {
                      markDirty();
                      setSeoDescription(e.target.value);
                    }}
                    maxLength={SEO_DESCRIPTION_MAX}
                    rows={3}
                    placeholder="Sahifangiz haqida qisqacha, qidiruv natijalarida ko'rinadigan matn."
                    className="mt-1.5 w-full resize-y rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
                  />
                  <p className="mt-1 text-right text-[11px] font-medium text-ink-3">
                    {seoDescription.length}/{SEO_DESCRIPTION_MAX}
                  </p>
                </div>
              </div>
            </div>

            {/* sitePublished toggle */}
            <div className="rounded-card bg-card p-4 shadow-card md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink">Sayt holati</p>
                  <p className="mt-1 text-[12px] text-ink-3">
                    {sitePublished
                      ? "Sahifangiz hammaga ko'rinadi."
                      : 'Sahifangiz vaqtincha yopilgan.'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={sitePublished}
                  aria-label="Saytni chop etish"
                  onClick={() => {
                    markDirty();
                    setSitePublished((prev) => !prev);
                  }}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full',
                    sitePublished ? 'bg-accent' : 'bg-line',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-5 rounded-full bg-white shadow',
                      sitePublished ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            </div>

            {validationError && (
              <p className="text-[13px] font-semibold text-brand-rose md:col-span-2">
                {validationError}
              </p>
            )}

            {save.isError && (
              <p className="text-[13px] font-semibold text-brand-rose md:col-span-2">
                {saveErrorMessage}
              </p>
            )}

            {saved && !save.isPending && (
              <p className="flex items-center gap-1.5 rounded-[12px] bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent-dark md:col-span-2">
                <Icon name="check" className="size-4" />
                Profil saqlandi.
              </p>
            )}

            <button
              type="submit"
              disabled={save.isPending}
              className="w-full rounded-[14px] bg-linear-to-br from-accent to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60 md:col-span-2"
            >
              {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>

          {/* ASIDE — a desktop-only live preview above the ratings panel. The ratings
              are a read-only mirror of the public rating; only shown once a slug is
              published (an unpublished realtor has no `/api/r/:slug` to read). */}
          <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-4">
            <ProfilePreview
              agency={agency}
              name={user?.name}
              brandColor={brandColor}
              logoUrl={profile.logoUrl}
              verified={profile.verified}
              slug={profile.slug}
              coverImageUrl={profile.coverImageUrl}
              tagline={tagline}
              sitePublished={sitePublished}
              contactPhone={contactPhone}
              contactTelegram={contactTelegram}
              contactWhatsapp={contactWhatsapp}
              instagramUrl={instagramUrl}
              telegramChannelUrl={telegramChannelUrl}
              className="hidden lg:block"
            />
            {profile.slug ? (
              <RatingsPanel slug={profile.slug} />
            ) : (
              <section className="rounded-card bg-card p-4 shadow-card">
                <p className="text-[13px] font-bold text-ink">Baholarim</p>
                <p className="mt-2 text-[13px] text-ink-3">
                  Ommaviy sahifangizni (slug) belgilang — shundan so'ng baholar ko'rinadi.
                </p>
              </section>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
