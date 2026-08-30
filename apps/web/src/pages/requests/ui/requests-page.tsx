import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TASHKENT_DISTRICTS, type Deal, type Lead, type ListingType } from '@rieltor/shared';
import { Link } from 'react-router';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { RequestCard, leadsQuery } from '@/entities/property-request';
import { ClaimButton } from '@/features/lead-claim';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

const DEAL_OPTIONS: { value: Deal | undefined; label: string }[] = [
  { value: undefined, label: 'Barchasi' },
  { value: 'SALE', label: 'Sotib olish' },
  { value: 'RENT', label: 'Ijara' },
];

const TYPE_OPTIONS: { value: ListingType | undefined; label: string }[] = [
  { value: undefined, label: 'Barchasi' },
  ...LISTING_TYPES.map((t) => ({ value: t, label: LISTING_TYPE_META[t].chipLabel })),
];

const ROOMS_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: 'Barchasi' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
];

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

function chipClass(active: boolean) {
  return cn(
    'shrink-0 rounded-full border px-[15px] py-2.5 text-[13.5px] font-semibold transition-colors',
    active
      ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30'
      : 'border-line bg-card text-ink-2',
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line/60 bg-card p-4 shadow-card">
      <div className="h-5 w-2/3 animate-pulse rounded bg-line" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
      <div className="h-8 w-40 animate-pulse rounded-full bg-line" />
    </div>
  );
}

/** Client-side mirror of the server's OPEN-request filter (deal/type/district
 * exact, roomsMin `gte`, priceMaxSom `lte`) — `GET /api/leads` is unfiltered
 * (score desc), so the board narrows the ≤100-row feed here. */
function matchesFilter(
  lead: Lead,
  deal: Deal | undefined,
  type: ListingType | undefined,
  district: string | undefined,
  roomsMin: number | undefined,
  priceMaxSom: string | undefined,
): boolean {
  if (deal && lead.deal !== deal) return false;
  if (type && lead.type !== type) return false;
  if (district && lead.district !== district) return false;
  if (roomsMin != null && (lead.roomsMin == null || lead.roomsMin < roomsMin)) return false;
  if (priceMaxSom && (lead.priceMaxSom == null || BigInt(lead.priceMaxSom) > BigInt(priceMaxSom)))
    return false;
  return true;
}

/**
 * `/requests` — the realtor lead feed. Buyers post reverse requests; the feed
 * scores them and surfaces the best first (`GET /api/leads`, RealtorGuard). A
 * realtor claims a lead exclusively — the claim reveals the buyer's contact and
 * removes the lead from every other realtor's feed.
 */
export function RequestsPage() {
  const [deal, setDeal] = useState<Deal | undefined>(undefined);
  const [type, setType] = useState<ListingType | undefined>(undefined);
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [roomsMin, setRoomsMin] = useState<number | undefined>(undefined);
  const [priceMaxSom, setPriceMaxSom] = useState<string | undefined>(undefined);

  const { data, isPending, isError, error } = useQuery(leadsQuery());

  // A non-realtor is RealtorGuard-blocked (403); everything else is a real load error.
  const isForbidden = error instanceof ApiError && error.status === 403;

  const leads = data?.filter((lead) =>
    matchesFilter(lead, deal, type, district, roomsMin, priceMaxSom),
  );

  if (isForbidden) {
    return (
      <main>
        <PageHeading
          title="Lidlar"
          subtitle="Sifatli xaridor so'rovlari — eng yaxshisidan boshlab"
        />
        <div className="px-4 pt-3.5 desk:px-0 desk:pt-5">
          <div className="rounded-card border border-line/60 bg-card px-6 py-12 text-center">
            <p className="text-[15px] font-extrabold text-ink">Rieltor bo'ling</p>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-ink-2">
              Lidlar faqat rieltorlar uchun. Profilingizni rieltorga aylantiring va sifatli xaridor
              so'rovlarini oling.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeading
        title="Lidlar"
        subtitle="Sifatli xaridor so'rovlari — eng yaxshisini olib, mijoz bilan bog'laning"
      />

      <div className="px-4 pt-3.5 desk:px-0 desk:pt-5">
        <div className="mb-4 flex justify-end">
          <Link
            to="/requests/new"
            className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-2.5 text-[13.5px] font-extrabold text-white shadow-lg shadow-accent/35"
          >
            + Qidiruv joylash
          </Link>
        </div>

        <SectionCard title="Filtr" className="mb-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[13px] font-bold text-ink-2">Bitim turi</p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {DEAL_OPTIONS.map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDeal(value)}
                    className={chipClass(deal === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-bold text-ink-2">Obyekt turi</p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setType(value)}
                    className={chipClass(type === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-bold text-ink-2">Xonalar (kamida)</p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {ROOMS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setRoomsMin(value)}
                    className={chipClass(roomsMin === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 desk:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-ink-2">Tuman</span>
                <select
                  value={district ?? ''}
                  onChange={(e) => setDistrict(e.target.value || undefined)}
                  className={inputClass}
                >
                  <option value="">Barcha tumanlar</option>
                  {TASHKENT_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-ink-2">
                  Byudjet, so'm (gacha)
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={priceMaxSom ?? ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setPriceMaxSom(digits || undefined);
                  }}
                  placeholder="500000000"
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 desk:grid desk:grid-cols-2 desk:gap-5">
          {isPending && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}

          {!isPending &&
            !isError &&
            leads?.map((lead) => (
              <RequestCard key={lead.id} request={lead} revealSlot={<ClaimButton id={lead.id} />} />
            ))}
        </div>

        {isError && (
          <p className="px-6 py-12 text-center text-[15px] text-ink-2">
            Lidlarni yuklab bo'lmadi. Keyinroq urinib ko'ring.
          </p>
        )}

        {!isPending && !isError && leads && leads.length === 0 && (
          <p className="px-6 py-12 text-center text-[15px] leading-relaxed text-ink-2">
            Hozircha yangi lead yo'q.
          </p>
        )}
      </div>
    </main>
  );
}
