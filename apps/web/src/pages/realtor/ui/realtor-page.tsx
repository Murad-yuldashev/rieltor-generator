import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { ListingCard } from '@/entities/listing';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { NotFoundView } from '@/widgets/not-found';
import { realtorQuery } from '../api';

function PageSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface">
      <div className="space-y-3.5 p-4">
        <div className="h-40 animate-pulse rounded-card bg-card" />
        <div className="h-80 animate-pulse rounded-card bg-card" />
        <div className="h-80 animate-pulse rounded-card bg-card" />
      </div>
    </div>
  );
}

export function RealtorPage() {
  const { slug = '' } = useParams();
  const { data, isPending, error } = useQuery(realtorQuery(slug));

  if (isPending) return <PageSkeleton />;

  if (error) {
    // An unknown slug gets the plain "not found" page (mirrors the listing page).
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Rieltor sahifasini yuklab bo'lmadi.</p>;
  }

  // brandColor is hex-validated server-side, but is still treated as data here:
  // it only feeds a CSS custom property that our own styles read via
  // var(--brand, …). It can never break out into another CSS property or the DOM.
  // When null, --brand is unset and the app's default accent takes over.
  const brandStyle = data.brandColor
    ? ({ '--brand': data.brandColor } as CSSProperties)
    : undefined;

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface pb-10" style={brandStyle}>
      <header
        className="px-5 pt-8 pb-7 text-white"
        style={{ background: 'var(--brand, var(--color-accent))' }}
      >
        <div className="flex items-center gap-4">
          {data.logoUrl && (
            <img
              src={data.logoUrl}
              alt={data.name}
              className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/40 bg-white object-cover"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight font-extrabold">{data.name}</h1>
            {data.agency && (
              <p className="mt-1 text-[14px] font-semibold text-white/85">{data.agency}</p>
            )}
            {data.verified && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide">
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                Tasdiqlangan
              </span>
            )}
          </div>
        </div>

        {data.bio && (
          <p className="mt-4 text-[14px] leading-[1.55] font-medium text-white/90">{data.bio}</p>
        )}

        {(data.experienceYears !== null || data.regions.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {data.experienceYears !== null && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold">
                {data.experienceYears} yil tajriba
              </span>
            )}
            {data.regions.map((region) => (
              <span
                key={region}
                className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold"
              >
                {region}
              </span>
            ))}
          </div>
        )}
      </header>

      <section className="p-4">
        <h2 className="mb-3.5 text-[15px] font-extrabold text-ink">E'lonlar</h2>
        {data.listings.length === 0 ? (
          <p className="rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
            Hozircha e'lonlar yo'q
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.listings.map((listing, index) => (
              // The marketplace card already links to /obj/:id — reused, not cloned.
              <ListingCard key={listing.id} listing={listing} isFirst={index === 0} />
            ))}
          </div>
        )}
      </section>

      {/* Reserved for 3.3b: rating/reviews */}
    </main>
  );
}
