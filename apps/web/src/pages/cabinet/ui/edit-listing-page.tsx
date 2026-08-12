import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router';
import { useMe } from '@/features/auth';
import { ListingForm, myListingQuery } from '@/features/listing-form';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';

export function EditListingPage() {
  const { id = '' } = useParams();
  const { realtor, isLoading: meLoading } = useMe();
  // Deferred until sign-in state is known, so a signed-out visitor landing here
  // directly does not fire a doomed authenticated request.
  const { data, isPending, error } = useQuery({ ...myListingQuery(id), enabled: !meLoading });

  if (meLoading) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">Yuklanmoqda…</p>
      </main>
    );
  }

  // Publicly reachable route: bounce a signed-out visitor to /cabinet, which owns
  // the sign-in prompt (same convention as ProfilePage).
  if (!realtor) return <Navigate to="/cabinet" replace />;

  if (isPending) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">Yuklanmoqda…</p>
      </main>
    );
  }

  if (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return (
        <main className="px-4 py-10 text-center">
          <p className="text-[14px] font-semibold text-ink-2">E'lon topilmadi.</p>
          <Link to="/cabinet" className="mt-3 inline-block text-[13.5px] font-bold text-accent">
            Kabinetga qaytish
          </Link>
        </main>
      );
    }
    return <p className="p-6 text-center text-ink-2">E'lonni yuklab bo'lmadi.</p>;
  }

  return (
    // Outside TabLayout on purpose — same reasoning as the listing detail page: this
    // is a focused, deep task (12+ fields, photo upload) where the bottom nav is
    // only clutter, not a live destination the user is switching away from.
    <div className="mx-auto min-h-dvh max-w-content bg-surface">
      <Link
        to="/cabinet"
        className="mt-3.5 ml-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-accent"
      >
        <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
        Kabinet
      </Link>

      <PageHeading title="E'lonni tahrirlash" subtitle={data.title || "Yangi e'lon"} />

      <ListingForm listingId={id} initial={data} hasPhone={Boolean(realtor.phone)} />
    </div>
  );
}
