import { useState } from 'react';
import { Link } from 'react-router';
import {
  TASHKENT_DISTRICTS,
  type Deal,
  type ListingType,
  type PropertyRequestCreate,
  type PropertyRequestSummary,
} from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { useCreateRequest } from '@/entities/property-request';
import { useSession } from '@/entities/session';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';
import { AuthPrompt } from './auth-prompt';

const DEALS: { value: Deal; label: string }[] = [
  { value: 'SALE', label: 'Sotib olish' },
  { value: 'RENT', label: 'Ijara' },
];

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

function segmentClass(active: boolean) {
  return cn(
    'flex-1 rounded-[9px] py-2.5 text-sm font-bold transition-colors',
    active ? 'bg-white text-ink shadow-sm' : 'text-ink-2',
  );
}

/**
 * `/requests/new` — post a "Qidiryapman" buyer request. Only the deal is
 * required; every other constraint is optional so the form stays a quick ask,
 * not a full listing. Auth-gated like the wizard.
 */
export function RequestCreatePage() {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const create = useCreateRequest();

  const [deal, setDeal] = useState<Deal>('SALE');
  const [type, setType] = useState<ListingType | ''>('');
  const [district, setDistrict] = useState('');
  const [roomsMin, setRoomsMin] = useState('');
  const [priceMaxSom, setPriceMaxSom] = useState('');
  const [areaMinM2, setAreaMinM2] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<PropertyRequestSummary | null>(null);

  if (isSessionPending) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center text-[14px] text-ink-2">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPrompt />;

  async function handleSubmit() {
    setError(null);
    const body: PropertyRequestCreate = {
      deal,
      ...(type ? { type } : {}),
      ...(district ? { district } : {}),
      ...(roomsMin ? { roomsMin: Number(roomsMin) } : {}),
      ...(priceMaxSom ? { priceMaxSom } : {}),
      ...(areaMinM2 ? { areaMinM2: Number(areaMinM2) } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    try {
      const summary = await create.mutateAsync(body);
      setCreated(summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Joylab bo'lmadi. Qaytadan urinib ko'ring.");
    }
  }

  if (created) {
    return (
      <main>
        <PageHeading title="Qidiruv joylandi" subtitle="So'rovingiz rieltorlar taxtasiga chiqdi." />

        <div className="px-4 pt-3.5 md:mx-auto md:max-w-2xl desk:max-w-2xl desk:px-0 desk:pt-5">
          <SectionCard>
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-[22px] text-brand-green">
                ✓
              </span>
              <p className="text-[15px] font-extrabold text-ink">Qidiruvingiz joylandi</p>
              <p className="text-[13px] font-semibold text-ink-2">
                So'rovingiz rieltorlar taxtasiga chiqdi.
              </p>
              <Link
                to="/my/requests"
                className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[14px] font-extrabold text-white shadow-lg shadow-accent/35"
              >
                Qidiruvlarim
              </Link>
            </div>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeading
        title="Qidiruv joylash"
        subtitle="Qanday uy qidiryapsiz? Faqat bitim turi majburiy."
      />

      <div className="px-4 pt-3.5 md:mx-auto md:max-w-2xl desk:max-w-2xl desk:px-0 desk:pt-5">
        <SectionCard>
          <div className="flex flex-col gap-5">
            <p className="text-[13px] font-semibold leading-relaxed text-accent">
              To'liqroq to'ldiring — ko'proq rieltor sizni ko'radi.
            </p>

            <div>
              <p className="mb-2.5 text-[13.5px] font-bold text-ink-2">Bitim turi</p>
              <div
                role="tablist"
                aria-label="Bitim turi"
                className="flex rounded-xl bg-[#e8e8ee] p-1"
              >
                {DEALS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={deal === value}
                    onClick={() => setDeal(value)}
                    className={segmentClass(deal === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">Obyekt turi</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ListingType | '')}
                className={inputClass}
              >
                <option value="">Farqi yo'q</option>
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LISTING_TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">Tuman</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={inputClass}
              >
                <option value="">Farqi yo'q</option>
                {TASHKENT_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 desk:grid-cols-2">
              <label className="block">
                <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">
                  Xonalar (kamida)
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={roomsMin}
                  onChange={(e) => setRoomsMin(e.target.value.replace(/\D/g, ''))}
                  placeholder="2"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">
                  Maydon, m² (kamida)
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={areaMinM2}
                  onChange={(e) => setAreaMinM2(e.target.value.replace(/\D/g, ''))}
                  placeholder="50"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">
                Byudjet, so'm (gacha)
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={priceMaxSom}
                onChange={(e) => setPriceMaxSom(e.target.value.replace(/\D/g, ''))}
                placeholder="500000000"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">Izoh</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Masalan: metro yaqinida, ta'mirli"
                className={cn(inputClass, 'resize-none')}
              />
            </label>

            {error && <p className="text-[13px] font-semibold text-brand-rose">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={create.isPending}
              className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {create.isPending ? 'Joylanmoqda...' : 'Qidiruv joylash'}
            </button>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
