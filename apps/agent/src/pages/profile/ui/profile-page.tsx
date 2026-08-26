import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { RealtorProfileUpdate } from '@rieltor/shared';
import { useProfile, useSaveProfile } from '@/features/profile';
import { Icon } from '@/shared/ui/icon';

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

/** Same-membership check for two region lists (order is stable, from the constant). */
function sameRegions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((region, i) => region === b[i]);
}

/**
 * The realtor's editable profile. Loads the current values from
 * `GET /api/agent/profile` (which returns all-defaults for a realtor who has never
 * saved — handled the same as any other value), lets the realtor edit the four
 * fields, and PATCHes only the fields that actually changed so the all-optional
 * update never carries a field the schema would reject.
 */
export function ProfilePage() {
  const { data: profile, isPending, isError } = useProfile();
  const save = useSaveProfile();

  const [agency, setAgency] = useState('');
  const [bio, setBio] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  // Kept as a string so the field can be blank (→ null on save) rather than 0.
  const [experienceYears, setExperienceYears] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed the form from the server profile exactly once. A guard (rather than a
  // plain [profile] dependency) keeps a later background refetch — or the cache
  // reseed after a successful save — from clobbering in-progress edits.
  const seeded = useRef(false);
  useEffect(() => {
    if (!profile || seeded.current) return;
    seeded.current = true;
    setAgency(profile.agency);
    setBio(profile.bio ?? '');
    setRegions(profile.regions);
    setExperienceYears(profile.experienceYears === null ? '' : String(profile.experienceYears));
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

    // Build the patch from changed fields only: an all-optional PATCH must never
    // carry a field the schema could reject, and unchanged fields need no write.
    const patch: RealtorProfileUpdate = {};
    if (trimmedAgency !== profile.agency) patch.agency = trimmedAgency;
    if (nextBio !== profile.bio) patch.bio = nextBio;
    if (!sameRegions(regions, profile.regions)) patch.regions = regions;
    if (nextExperience !== profile.experienceYears) patch.experienceYears = nextExperience;

    setValidationError(null);

    // Nothing changed — no request; the stored profile already matches the form.
    if (Object.keys(patch).length === 0) {
      setSaved(true);
      return;
    }

    save.mutate(patch, { onSuccess: () => setSaved(true) });
  }

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

          {validationError && (
            <p className="text-[13px] font-semibold text-brand-rose">{validationError}</p>
          )}

          {save.isError && (
            <p className="text-[13px] font-semibold text-brand-rose">
              Saqlashda xatolik. Qayta urinib ko'ring.
            </p>
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
      )}
    </main>
  );
}
