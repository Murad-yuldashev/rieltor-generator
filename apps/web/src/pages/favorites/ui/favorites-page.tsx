import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ListingRow, listingsQuery } from '@/entities/listing';
import { FavoriteButton, useFavoriteIds } from '@/features/favorites';
import { PageHeading } from '@/shared/ui/page-heading';

export function FavoritesPage() {
  const { data, isPending } = useQuery(listingsQuery());
  const ids = useFavoriteIds();

  // Shown in save order, most recently favourited first.
  const saved = ids
    .map((id) => data?.find((listing) => listing.id === id))
    .filter((listing) => listing !== undefined);

  const isEmpty = !isPending && saved.length === 0;

  return (
    <main>
      <PageHeading
        title="Sevimlilar"
        subtitle={
          isEmpty
            ? 'Hozircha bitta ham saqlangan obyekt yo‘q'
            : `${saved.length} ta saqlangan obyekt`
        }
      />

      {!isEmpty && (
        <p className="mx-4 mt-3 rounded-card bg-accent-soft px-4 py-3.5 text-[13.5px] leading-snug font-bold text-accent desk:mx-0 desk:mt-5">
          🔔 Saqlangan obyektlar narxi o'zgarsa yoki e'lon yopilsa — sizga darhol xabar beramiz.
        </p>
      )}

      <div className="mt-3.5 flex flex-col gap-2.5 px-4 md:grid md:grid-cols-2 md:gap-3.5 desk:grid desk:grid-cols-2 desk:gap-3.5 desk:px-0">
        {isPending &&
          ids.map((id) => (
            <div key={id} className="h-[110px] animate-pulse rounded-card bg-card" />
          ))}

        {saved.map((listing) => (
          <ListingRow
            key={listing.id}
            listing={listing}
            favoriteSlot={<FavoriteButton id={listing.id} className="h-8 w-8 shadow-none" />}
          />
        ))}
      </div>

      {isEmpty ? (
        <div className="px-6 py-14 text-center">
          <p className="text-[15px] leading-relaxed text-ink-2">
            Yoqqan e'lonni saqlash uchun karta burchagidagi ♡ belgisini bosing — u shu yerda
            saqlanadi.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-accent/35"
          >
            Obyektlarni ko'rish
          </Link>
        </div>
      ) : (
        <p className="px-8 py-8 text-center text-[13px] leading-relaxed font-semibold text-ink-3">
          Yoqqan e'lonni saqlash uchun karta burchagidagi ♡ belgisini bosing — u shu yerda
          saqlanadi.
        </p>
      )}
    </main>
  );
}
