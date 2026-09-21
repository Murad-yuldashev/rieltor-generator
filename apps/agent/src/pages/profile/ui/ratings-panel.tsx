import { formatListedAt, type PublicReview } from '@rieltor/shared';
import { useMyRating } from '@/features/profile';
import { RatingStars } from '@/shared/ui/rating-stars';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

/** One APPROVED review as it appears in the realtor's own "Baholarim" list. Read-only:
 * a realtor sees the same public reviews buyers do but cannot moderate or reply here. */
function ReviewRow({ review }: { review: PublicReview }) {
  return (
    <li className="rounded-[12px] border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        {review.authorPhotoUrl ? (
          <img
            src={review.authorPhotoUrl}
            alt={review.authorName}
            loading="lazy"
            decoding="async"
            className="size-9 shrink-0 rounded-full bg-accent-soft object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[14px] font-extrabold text-accent">
            {review.authorName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">{review.authorName}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <RatingStars value={review.rating} />
            <span className="text-[12px] font-medium text-ink-3">
              {formatListedAt(review.createdAt.slice(0, 10))}
            </span>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-2 text-[13px] leading-[1.55] font-medium text-ink-2">{review.comment}</p>
      )}
    </li>
  );
}

/** "Baholarim" — a read-only mirror of the realtor's public rating + APPROVED reviews,
 * fetched from their own `GET /api/r/:slug`. Only mounted once a slug is set (see the
 * caller), so `slug` is always a real, published page here. A StatTileRow surfaces the
 * average rating and review count above the read-only review list. */
export function RatingsPanel({ slug }: { slug: string }) {
  const { data, isPending, isError } = useMyRating(slug);

  return (
    <section className="rounded-card bg-card p-4 shadow-card">
      <p className="text-[13px] font-bold text-ink">Baholarim</p>

      {isPending ? (
        <p className="mt-2 text-[13px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !data ? (
        <p className="mt-2 text-[13px] font-semibold text-brand-rose">
          Baholarni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <>
          <StatTileRow className="mt-3 grid grid-cols-2 gap-3">
            <StatTile
              label="O'rtacha baho"
              value={data.ratingAvg !== null ? data.ratingAvg.toFixed(1) : '—'}
            />
            <StatTile label="Baholar soni" value={String(data.ratingCount)} />
          </StatTileRow>

          {data.reviews.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {data.reviews.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
