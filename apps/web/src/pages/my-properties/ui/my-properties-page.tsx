import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useSession } from '@/entities/session';
import { trackedPropertiesQuery } from '@/entities/tracked-property';
import { PageHeading } from '@/shared/ui/page-heading';
import { AuthPrompt } from './auth-prompt';
import { PropertyCard } from './property-card';

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 desk:grid desk:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-[132px] animate-pulse rounded-card bg-card" />
      ))}
    </div>
  );
}

/** Nothing tracked yet — point the seller straight at the free valuation hook. */
function EmptyState() {
  return (
    <div className="rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
      <p className="text-[40px]">🏡</p>
      <p className="mt-2 text-[16px] font-extrabold tracking-tight">Hali kuzatilayotgan uy yo'q</p>
      <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-ink-2">
        Uyingizni baholang — biz uning bozor narxini har oy kuzatib boramiz va o'zgarganda xabar
        beramiz.
      </p>
      <Link
        to="/valuation"
        className="mt-4 inline-block rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3 text-[14px] font-extrabold text-white shadow-lg shadow-accent/35"
      >
        Uyingizni baholang
      </Link>
    </div>
  );
}

/**
 * `/my/properties` — "Mening uyim" cabinet: the homes the caller is tracking,
 * each with its latest estimate, monthly delta and a sparkline. Auth-gated like
 * the listing cabinet (`AuthPrompt`, no crash for a logged-out visitor).
 */
export function MyPropertiesPage() {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const { data: properties, isPending: isPropertiesPending } = useQuery({
    ...trackedPropertiesQuery(),
    enabled: isAuthenticated,
  });

  if (isSessionPending) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center text-[14px] text-ink-2">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPrompt />;

  const isLoading = isPropertiesPending;
  const count = properties?.length ?? 0;

  return (
    <main>
      <PageHeading
        title="Mening uyim"
        subtitle={
          isLoading
            ? 'Yuklanmoqda...'
            : count > 0
              ? `${count} ta kuzatilayotgan uy`
              : 'Hozircha uy kuzatmayapsiz'
        }
      />

      <div className="px-4 pt-3.5 pb-2 desk:max-w-3xl desk:px-0 desk:pt-5">
        {isLoading && <CardSkeleton />}

        {!isLoading && count === 0 && <EmptyState />}

        {!isLoading && count > 0 && (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 desk:grid desk:grid-cols-2">
            {properties?.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
