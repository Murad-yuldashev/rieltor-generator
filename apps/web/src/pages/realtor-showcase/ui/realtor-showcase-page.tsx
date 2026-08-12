import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { ListingCard } from '@/entities/listing';
import { RealtorCard, SoldBadge, realtorShowcaseQuery } from '@/entities/realtor';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { NotFoundView } from '@/widgets/not-found';

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-line" />
      <div className="space-y-2.5 p-4">
        <div className="h-5 w-1/2 animate-pulse rounded bg-line" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface px-4 pt-4 pb-8">
      <div className="h-[104px] animate-pulse rounded-card bg-card" />
      <div className="mt-5 flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Public realtor showcase, design spec §9.1. A standalone page outside TabLayout
 * (like /obj/:id) — no bottom nav, no site header, reached from a shared /r/:username
 * link. The SSR meta tags that make that link preview nicely in Telegram are built
 * server-side by RealtorSsrController; this component only renders the SPA the
 * browser actually shows once the page's JS has loaded.
 */
export function RealtorShowcasePage() {
  const { username = '' } = useParams();
  const navigate = useNavigate();
  const { data, isPending, error } = useQuery(realtorShowcaseQuery(username));

  if (isPending) return <PageSkeleton />;

  if (error) {
    // Unknown username gets a dedicated not-found state (spec §14's pattern, reused
    // from the listing page). Other errors get a plain retry-free message.
    if (error instanceof ApiError && error.status === 404) {
      return (
        <NotFoundView
          title="Bunday rieltor topilmadi"
          subtitle="Havola eskirgan yoki foydalanuvchi nomi noto'g'ri."
          linkLabel="Bosh sahifa"
        />
      );
    }
    return <p className="p-6 text-center text-ink-2">Rieltor ma'lumotini yuklab bo'lmadi.</p>;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface pb-8">
      <div className="px-4 pt-4">
        <button
          type="button"
          // With no history (the link was opened directly, the common case for a
          // shared /r/:username link) fall back to the home page — same idiom as
          // the listing gallery's own back button.
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="flex items-center gap-1 text-[13.5px] font-bold text-ink-2"
        >
          <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
          Orqaga
        </button>
      </div>

      <main className="flex flex-col gap-5 px-4 pt-3">
        <RealtorCard
          name={data.name}
          agency={data.agency}
          photoUrl={data.photoUrl}
          phone={data.phone}
          telegram={data.telegram}
          registryNo={data.registryNo}
        />

        <section>
          <h2 className="mb-3 text-[15px] font-extrabold tracking-tight">Faol e'lonlar</h2>

          {data.listings.length === 0 ? (
            <p className="rounded-card border border-line/60 bg-card px-4 py-8 text-center text-[13.5px] font-semibold text-ink-3">
              Hozircha faol e'lonlar yo'q.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.listings.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} isFirst={i === 0} />
              ))}
            </div>
          )}
        </section>

        {/* Design spec §9.1: a separate section, shown only once the realtor has a
            sold/rented history — an empty heading with nothing under it helps no one. */}
        {data.sold.length > 0 && (
          <section>
            <h2 className="mb-3 text-[15px] font-extrabold tracking-tight">Sotilgan obyektlar</h2>
            <div className="flex flex-col gap-4">
              {data.sold.map((listing) => (
                <div key={listing.id} className="relative">
                  <ListingCard listing={listing} />
                  <div className="absolute top-2.5 right-2.5">
                    <SoldBadge status={listing.status} days={listing.soldInDays} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
