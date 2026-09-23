import { useState } from 'react';
import { formatPriceSom, type RealtorOwnListing } from '@rieltor/shared';
import { useOwnListings } from '@/features/social-content';
import { SocialCardModal } from '@/widgets/social-card-modal';

export function MyListingsPage() {
  const { data: listings, isPending, isError } = useOwnListings();
  const [active, setActive] = useState<RealtorOwnListing | null>(null);

  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface p-4 md:max-w-none">
      <h1 className="mb-4 text-lg font-extrabold text-ink">Mening e'lonlarim</h1>

      {isPending && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-card bg-card" />
          ))}
        </div>
      )}
      {isError && <p className="font-semibold text-brand-rose">E'lonlarni yuklab bo'lmadi.</p>}
      {listings && listings.length === 0 && (
        <p className="rounded-card border border-line/60 bg-card px-4 py-10 text-center text-ink-2">
          Hali PUBLISHED e'loningiz yo'q. E'lon joylang — shu yerda kontent yaratasiz.
        </p>
      )}

      {listings && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4">
          {listings.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-card border border-line/60 bg-card">
              {l.imageUrl ? (
                <img
                  src={l.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-accent-soft" />
              )}
              <div className="p-3">
                <p className="truncate text-[14px] font-bold text-ink">{l.title}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-ink-2">
                  {formatPriceSom(l.priceSom, l.deal)}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-3">{l.district}</p>
                <button
                  type="button"
                  onClick={() => setActive(l)}
                  className="mt-3 w-full rounded-[12px] bg-accent px-4 py-2.5 text-[13px] font-extrabold text-white"
                >
                  Kontent yaratish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && <SocialCardModal listing={active} onClose={() => setActive(null)} />}
    </div>
  );
}
