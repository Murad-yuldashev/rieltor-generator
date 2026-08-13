import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ListingRow, listingsQuery } from '@/entities/listing';
import { FavoriteButton, useFavoriteIds } from '@/features/favorites';
import { PageHeading } from '@/shared/ui/page-heading';

export function FavoritesPage() {
  const { t } = useTranslation('feed');
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
        title={t('common:nav.favorites')}
        subtitle={
          isEmpty
            ? t('favoritesEmptySubtitle')
            : t('favoritesCountSubtitle', { n: saved.length })
        }
      />

      {!isEmpty && (
        <p className="mx-4 mt-3 rounded-card bg-accent-soft px-4 py-3.5 text-[13.5px] leading-snug font-bold text-accent">
          {t('priceAlertNotice')}
        </p>
      )}

      <div className="mt-3.5 flex flex-col gap-2.5 px-4">
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
          <p className="text-[15px] leading-relaxed text-ink-2">{t('favoriteHint')}</p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-accent/35"
          >
            {t('browseListings')}
          </Link>
        </div>
      ) : (
        <p className="px-8 py-8 text-center text-[13px] leading-relaxed font-semibold text-ink-3">
          {t('favoriteHint')}
        </p>
      )}
    </main>
  );
}
