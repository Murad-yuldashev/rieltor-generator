import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { ListingCard } from '@/entities/listing';
import { ApiError } from '@/shared/api/client';
import { NotFoundView } from '@/widgets/not-found';
import { presentationQuery } from '../api';

function PageSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface">
      <div className="space-y-3.5 p-4">
        <div className="h-20 animate-pulse rounded-card bg-card" />
        <div className="h-80 animate-pulse rounded-card bg-card" />
        <div className="h-80 animate-pulse rounded-card bg-card" />
      </div>
    </div>
  );
}

export function PresentationPage() {
  const { token = '' } = useParams();
  const { data, isPending, error } = useQuery(presentationQuery(token));

  if (isPending) return <PageSkeleton />;

  if (error) {
    // An unknown token gets the plain "not found" page (mirrors the listing page).
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Taqdimotni yuklab bo'lmadi.</p>;
  }

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface pb-10">
      <header className="bg-linear-to-br from-violet-600 to-accent-dark px-5 pt-8 pb-7 text-white">
        <p className="text-[12.5px] font-bold tracking-wide text-white/70 uppercase">Taqdimot</p>
        <h1 className="mt-1.5 text-2xl leading-tight font-extrabold">{data.title}</h1>
        <p className="mt-2.5 text-[13.5px] font-semibold text-white/85">
          {data.realtorName}
          {data.agency && ` · ${data.agency}`} tayyorladi
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4">
        {data.items.map((item) => (
          <section key={item.listingId} className="flex flex-col gap-2.5">
            {item.note && (
              <div className="rounded-card border border-accent/20 bg-accent-soft px-4 py-3">
                <p className="text-[11.5px] font-extrabold tracking-wide text-accent uppercase">
                  Rieltor izohi
                </p>
                <p className="mt-1 text-[14px] leading-[1.5] font-medium text-ink-2">{item.note}</p>
              </div>
            )}

            <ListingCard listing={item.listing} />

            <Link
              to={`/obj/${item.listingId}`}
              className="block rounded-[12px] border-[1.5px] border-accent py-2.5 text-center text-[14px] font-extrabold text-accent active:bg-accent-soft"
            >
              Batafsil
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
