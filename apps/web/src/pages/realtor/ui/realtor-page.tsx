import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { formatListedAt, type Deal, type PublicReview } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import { useSession } from '@/entities/session';
import { LoginModal } from '@/features/auth';
import {
  EMPTY_CRITERIA,
  FilterPanel,
  SortSelect,
  ListingFacets,
  filterListings,
  type Criteria,
} from '@/features/listing-filters';
import { useInfiniteScroll } from '@/shared/lib/use-infinite-scroll';
import { cn } from '@/shared/lib/cn';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { RatingStars, StarPicker } from '@/shared/ui/rating-stars';
import { NotFoundView } from '@/widgets/not-found';
import { myReviewQuery, realtorQuery, useSubmitReview } from '../api';
import { brandThemeVars } from '../lib/brand-theme';
import { ContactSection } from './contact-section';

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

const PAGE_SIZE = 8;

export function RealtorPage() {
  const { slug = '' } = useParams();
  const { data, isPending, error } = useQuery(realtorQuery(slug));

  // ALL hooks run unconditionally, BEFORE any early return (Rules of Hooks).
  const [criteria, setCriteria] = useState<Criteria>(EMPTY_CRITERIA);
  const [district, setDistrict] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const listings = data?.listings ?? [];
  const districts = useMemo(
    () => [...new Set(listings.map((l) => l.district))].sort((a, b) => a.localeCompare(b)),
    [listings],
  );
  const scoped = district ? listings.filter((l) => l.district === district) : listings;
  const matches = filterListings(scoped, criteria); // filterListings sorts by criteria.sort
  const shown = matches.slice(0, limit);
  const hasMore = matches.length > shown.length;
  const sentinelRef = useInfiniteScroll(hasMore, shown.length, () =>
    setLimit((n) => n + PAGE_SIZE),
  );

  const applyCriteria = (next: Criteria) => {
    setCriteria(next);
    setLimit(PAGE_SIZE);
  };
  const patch = (p: Partial<Criteria>) => applyCriteria({ ...criteria, ...p });
  // deal change resets the district facet so a stale RENT-only chip can't strand a SALE view.
  const pickDeal = (deal: Deal) => {
    setDistrict(null);
    applyCriteria({ ...criteria, deal });
  };
  const pickDistrict = (d: string | null) => {
    setDistrict(d);
    setLimit(PAGE_SIZE);
  };

  if (isPending) return <PageSkeleton />;
  if (error) {
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Rieltor sahifasini yuklab bo'lmadi.</p>;
  }

  const themeStyle = brandThemeVars(data.brandColor);

  if (!data.siteActive) {
    return (
      <main
        className="mx-auto flex min-h-dvh max-w-content items-center justify-center bg-surface p-6"
        style={themeStyle}
      >
        <div className="rounded-card border border-line/60 bg-card p-8 text-center">
          <h1 className="text-lg font-extrabold text-ink">{data.name}</h1>
          <p className="mt-2 text-[14px] font-medium text-ink-2">Bu sayt hozircha mavjud emas</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto min-h-dvh max-w-content bg-surface pb-10 md:max-w-none desk:max-w-none"
      style={themeStyle}
    >
      <header className="relative text-white">
        {data.coverImageUrl && (
          <img
            src={data.coverImageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="relative px-5 pt-8 pb-7"
          style={{
            background: data.coverImageUrl
              ? 'color-mix(in srgb, var(--brand, var(--color-accent)) 78%, transparent)'
              : 'var(--brand, var(--color-accent))',
          }}
        >
          <div className="mx-auto w-full max-w-content desk:max-w-desk desk:px-8">
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
                {data.tagline && (
                  <p className="mt-1 text-[14px] font-semibold text-white/85">{data.tagline}</p>
                )}
                {data.agency && (
                  <p className="mt-0.5 text-[13px] font-medium text-white/75">{data.agency}</p>
                )}
                {data.verified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide">
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /> Tasdiqlangan
                  </span>
                )}
              </div>
            </div>
            {data.bio && (
              <p className="mt-4 text-[14px] leading-[1.55] font-medium text-white/90">
                {data.bio}
              </p>
            )}
            {(data.experienceYears !== null || data.regions.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {data.experienceYears !== null && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold">
                    {data.experienceYears} yil tajriba
                  </span>
                )}
                {data.regions.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <ContactSection
        slug={slug}
        contactPhone={data.contactPhone}
        contactTelegram={data.contactTelegram}
        contactWhatsapp={data.contactWhatsapp}
        instagramUrl={data.instagramUrl}
        telegramChannelUrl={data.telegramChannelUrl}
      />

      <div className="desk:mx-auto desk:w-full desk:max-w-desk desk:px-8">
        <section className="p-4 desk:px-0">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold text-ink">E'lonlar · {matches.length} ta</h2>
            <SortSelect value={criteria.sort} onChange={(sort) => patch({ sort })} />
          </div>
          <ListingFacets
            deal={criteria.deal}
            onDealChange={pickDeal}
            type={criteria.type}
            onTypeChange={(type) => patch({ type })}
          />
          {districts.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => pickDistrict(null)}
                className={cn(
                  'shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors',
                  district === null
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-card text-ink-2',
                )}
              >
                Barcha tumanlar
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDistrict(d)}
                  className={cn(
                    'shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors',
                    district === d
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-card text-ink-2',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <label className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3">
            <Icon name="search" className="h-[17px] w-[17px] text-ink-3" strokeWidth={2.2} />
            <input
              type="search"
              value={criteria.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder="Tuman, majmua yoki ko'cha qidiring..."
              aria-label="Qidiruv"
              className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
            />
          </label>
          <details className="mt-3 rounded-card border border-line/60 bg-card p-4">
            <summary className="cursor-pointer text-[14px] font-bold text-ink">Filtrlar</summary>
            <div className="mt-3">
              <FilterPanel value={criteria} onChange={applyCriteria} />
            </div>
          </details>
          {matches.length === 0 ? (
            <p className="mt-4 rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
              Bu shartlarga mos e'lon topilmadi
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5">
              {shown.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} isFirst={i === 0} />
              ))}
            </div>
          )}
          {hasMore && <div ref={sentinelRef} aria-hidden className="mt-4 h-px w-full" />}
        </section>
        <ReviewsSection
          slug={slug}
          ratingAvg={data.ratingAvg}
          ratingCount={data.ratingCount}
          reviews={data.reviews}
        />
      </div>
    </main>
  );
}
