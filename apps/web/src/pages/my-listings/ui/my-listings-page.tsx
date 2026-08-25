import { formatPriceSom } from '@rieltor/shared';
import { Link } from 'react-router';
import { useSession } from '@/entities/session';
import { useSavedSearches } from '@/features/saved-search';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';
import { useMyListings, type MyListing } from '../model/use-my-listings';
import { AuthPrompt } from './auth-prompt';
import { StatusChip } from './status-chip';

function ListingThumb() {
  // listMine (Task 6) carries no image — a plain placeholder box stands in
  // rather than firing a per-row fetch just for a thumbnail.
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-3">
      <Icon name="home" className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

function ListingRow({ listing }: { listing: MyListing }) {
  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <ListingThumb />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-bold text-ink">{listing.title}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-ink-2">
          {formatPriceSom(listing.priceSom, listing.deal)}
        </p>
        {listing.status === 'REJECTED' && listing.rejectionReason && (
          <p className="mt-1 text-[12px] font-semibold text-brand-rose">
            Sabab: {listing.rejectionReason}
          </p>
        )}
      </div>
      <StatusChip status={listing.status} rejectionReason={listing.rejectionReason} />
    </div>
  );

  // Only a published listing has a public page to link to.
  return listing.status === 'PUBLISHED' ? (
    <Link to={`/obj/${listing.id}`} className="flex items-center py-3.5">
      {body}
    </Link>
  ) : (
    <div className="flex items-center py-3.5">{body}</div>
  );
}

function SavedSearchRow({
  id,
  name,
  query,
  onDelete,
}: {
  id: string;
  name: string;
  query: string;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">{name}</span>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={`/search?${query}`}
          className="rounded-full bg-accent-soft px-3.5 py-1.5 text-[12.5px] font-bold text-accent"
        >
          Ochish
        </Link>
        <button
          type="button"
          onClick={() => onDelete(id)}
          aria-label="Qidiruvni o'chirish"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface hover:text-brand-rose"
        >
          <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </li>
  );
}

function RowSkeleton({ count, className }: { count: number; className: string }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={className} />
      ))}
    </div>
  );
}

/**
 * `/my/listings` — the seller cabinet: the caller's own listings with their
 * moderation status, and the searches they've saved from the home page's
 * "Qidiruvni saqlash". Auth-gated like the wizard (`AuthPrompt`, no crash for
 * a logged-out visitor).
 */
export function MyListingsPage() {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const { listings, isPending: isListingsPending } = useMyListings();
  const { savedSearches, isPending: isSavedSearchesPending, remove } = useSavedSearches();

  if (isSessionPending) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center text-[14px] text-ink-2">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPrompt />;

  return (
    <main>
      <PageHeading
        title="Mening e'lonlarim"
        subtitle={
          isListingsPending
            ? 'Yuklanmoqda...'
            : listings.length > 0
              ? `${listings.length} ta e'lon`
              : "Hozircha e'lon joylamagansiz"
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-3.5 md:mx-auto md:max-w-2xl desk:max-w-2xl desk:px-0 desk:pt-5">
        <SectionCard title="E'lonlar">
          {isListingsPending && (
            <RowSkeleton count={3} className="h-14 animate-pulse rounded-xl bg-surface" />
          )}

          {!isListingsPending && listings.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-[14px] leading-relaxed text-ink-2">Hali e'lon joylamagansiz.</p>
              <Link
                to="/my/listings/new"
                className="mt-3 inline-block rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-2.5 text-[13.5px] font-extrabold text-white shadow-lg shadow-accent/35"
              >
                + E'lon joylash
              </Link>
            </div>
          )}

          {!isListingsPending && listings.length > 0 && (
            <ul className="divide-y divide-line">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <ListingRow listing={listing} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Saqlangan qidiruvlar">
          {isSavedSearchesPending && (
            <RowSkeleton count={2} className="h-9 animate-pulse rounded-xl bg-surface" />
          )}

          {!isSavedSearchesPending && savedSearches.length === 0 && (
            <p className="py-4 text-center text-[13.5px] leading-relaxed text-ink-2">
              Saqlangan qidiruvlar yo'q. Qidiruv paytida "Qidiruvni saqlash" tugmasini bosing.
            </p>
          )}

          {!isSavedSearchesPending && savedSearches.length > 0 && (
            <ul className="divide-y divide-line">
              {savedSearches.map((s) => (
                <SavedSearchRow
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  query={s.query}
                  onDelete={remove}
                />
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </main>
  );
}
