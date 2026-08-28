import { useEffect, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { formatListedAt, type PublicReview } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import { useSession } from '@/entities/session';
import { LoginModal } from '@/features/auth';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { RatingStars, StarPicker } from '@/shared/ui/rating-stars';
import { NotFoundView } from '@/widgets/not-found';
import { myReviewQuery, realtorQuery, useSubmitReview } from '../api';

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

/** A single APPROVED review row. Falls back to an initial-letter avatar when the
 * author has no photo. */
function ReviewRow({ review }: { review: PublicReview }) {
  return (
    <li className="rounded-card border border-line/60 bg-card p-4">
      <div className="flex items-center gap-3">
        {review.authorPhotoUrl ? (
          <img
            src={review.authorPhotoUrl}
            alt={review.authorName}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-full bg-accent-soft object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-extrabold text-accent">
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
        <p className="mt-2.5 text-[13.5px] leading-[1.55] font-medium text-ink-2">
          {review.comment}
        </p>
      )}
    </li>
  );
}

/** The signed-in viewer's review form. Pre-fills from any existing review and
 * lets them (re)submit; a PENDING review shows a moderation notice but stays
 * editable. Whether the viewer may review this realtor is the server's call —
 * a self-review returns a 400 whose message is surfaced here. */
function ReviewForm({ slug }: { slug: string }) {
  const { data: myReview } = useQuery(myReviewQuery(slug));
  const submit = useSubmitReview(slug);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // Seed the picker/textarea from an existing review once it arrives. The guard
  // stops a later refetch (e.g. right after submitting) from wiping live edits.
  useEffect(() => {
    if (myReview && !prefilled) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? '');
      setPrefilled(true);
    }
  }, [myReview, prefilled]);

  const handleSubmit = () => {
    if (rating < 1) return;
    const trimmed = comment.trim();
    submit.mutate({ rating, comment: trimmed || undefined });
  };

  // A 400 from the server is a rule the client can't pre-check (e.g. reviewing
  // yourself) — its message is user-facing Uzbek copy, so surface it verbatim.
  const errorText = submit.error
    ? submit.error instanceof ApiError && submit.error.status === 400
      ? submit.error.message
      : "Xatolik yuz berdi. Qaytadan urinib ko'ring."
    : null;

  return (
    <div className="rounded-card border border-line/60 bg-card p-4">
      <p className="text-[14px] font-extrabold text-ink">Sharhingizni qoldiring</p>

      {myReview?.status === 'PENDING' && (
        <p className="mt-2 rounded-[12px] bg-brand-amber/10 px-3 py-2 text-[12.5px] font-semibold text-brand-amber">
          Sharhingiz moderatsiyada
        </p>
      )}

      <div className="mt-3">
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Fikringiz (ixtiyoriy)"
        className="mt-3 w-full resize-none rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent"
      />

      {errorText && <p className="mt-2 text-[12.5px] font-semibold text-brand-rose">{errorText}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={rating < 1 || submit.isPending}
        style={{ background: 'var(--brand, var(--color-accent))' }}
        className="mt-3 w-full rounded-[14px] px-5 py-3.5 text-[14.5px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submit.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
      </button>
    </div>
  );
}

interface ReviewsSectionProps {
  slug: string;
  ratingAvg: number | null;
  ratingCount: number;
  reviews: PublicReview[];
}

/** The "Baholar" block: the aggregate header, the APPROVED reviews list, and
 * the review form (or a login prompt for logged-out visitors). */
function ReviewsSection({ slug, ratingAvg, ratingCount, reviews }: ReviewsSectionProps) {
  const { isAuthenticated } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <section className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-ink">Baholar</h2>
        <div className="flex items-center gap-2">
          <RatingStars value={ratingAvg ?? 0} />
          <span className="text-[13px] font-semibold text-ink-2">
            {ratingCount > 0
              ? `${(ratingAvg ?? 0).toFixed(1)} · ${ratingCount} ta sharh`
              : "Hali sharhlar yo'q"}
          </span>
        </div>
      </div>

      {reviews.length > 0 && (
        <ul className="mb-4 space-y-3">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </ul>
      )}

      {isAuthenticated ? (
        <ReviewForm slug={slug} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            style={{ background: 'var(--brand, var(--color-accent))' }}
            className="w-full rounded-[14px] px-5 py-3.5 text-[14.5px] font-extrabold text-white"
          >
            Sharh qoldirish uchun kiring
          </button>
          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </>
      )}
    </section>
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

      <ReviewsSection
        slug={slug}
        ratingAvg={data.ratingAvg}
        ratingCount={data.ratingCount}
        reviews={data.reviews}
      />
    </main>
  );
}
