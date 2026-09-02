import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { ModeratorReviewRow } from '@rieltor/shared';
import { useSession } from '@/entities/session';
import { apiPatch } from '@/shared/api/client';
import { RatingStars } from '@/shared/ui/rating-stars';
import { MODERATION_REVIEWS_KEY, moderationReviewsQuery } from '../api';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-ink">Sharhlarni tekshirish</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/moderation/realtors"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Rieltorlar →
          </Link>
          <Link
            to="/moderation/conversion"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Konversiya →
          </Link>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </main>
  );
}

/** The approve/reject queue — only mounted once the role gate has passed. */
function ReviewQueue() {
  const { data, isPending, error } = useQuery(moderationReviewsQuery);
  const queryClient = useQueryClient();

  const moderateMutation = useMutation({
    // PATCH /api/moderation/reviews/:id with { status } — the token is attached
    // by the client. The endpoint returns { id, status }, but the mutation only
    // needs the success signal, so no response schema is parsed. On success the
    // list is invalidated so the moderated row drops out of the queue.
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      apiPatch(`/api/moderation/reviews/${id}`, undefined, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_REVIEWS_KEY }),
  });

  if (isPending) {
    return <p className="py-10 text-center text-[14px] font-medium text-ink-2">Yuklanmoqda...</p>;
  }

  if (error) {
    return (
      <p className="py-10 text-center text-[14px] font-medium text-ink-2">
        Ro&apos;yxatni yuklab bo&apos;lmadi.
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
        Sharhlar yo&apos;q
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {data.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          isUpdating={moderateMutation.isPending && moderateMutation.variables?.id === review.id}
          onModerate={(status) => moderateMutation.mutate({ id: review.id, status })}
        />
      ))}
    </ul>
  );
}

function ReviewItem({
  review,
  isUpdating,
  onModerate,
}: {
  review: ModeratorReviewRow;
  isUpdating: boolean;
  onModerate: (status: 'APPROVED' | 'REJECTED') => void;
}) {
  return (
    <li className="rounded-card border border-line/60 bg-card p-3.5 shadow-card">
      <div className="flex items-center gap-1.5">
        {review.realtorSlug ? (
          <Link
            to={`/r/${review.realtorSlug}`}
            className="text-[15px] font-extrabold text-accent hover:underline"
          >
            {review.realtorName}
          </Link>
        ) : (
          <span className="text-[15px] font-extrabold text-ink">{review.realtorName}</span>
        )}
        <RatingStars value={review.rating} />
      </div>

      <p className="mt-0.5 text-[12.5px] font-semibold text-ink-3">{review.authorName}</p>

      {review.comment && (
        <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-2">{review.comment}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onModerate('APPROVED')}
          disabled={isUpdating}
          className="rounded-[10px] bg-brand-green px-3.5 py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
        >
          Tasdiqlash
        </button>
        <button
          type="button"
          onClick={() => onModerate('REJECTED')}
          disabled={isUpdating}
          className="rounded-[10px] border border-line bg-card px-3.5 py-2 text-[13px] font-extrabold text-ink-2 disabled:opacity-50"
        >
          Rad etish
        </button>
      </div>
    </li>
  );
}

/**
 * Moderator-only review queue. Rendered outside the tab layout (a full-screen
 * admin surface, same as the realtor verification screen). The route is not
 * hidden — the gate here is the real client-side protection, backed by the
 * API's bearer-token check.
 */
export function ModerationReviewsPage() {
  const { user, isPending } = useSession();

  if (isPending) {
    return (
      <Shell>
        <p className="py-10 text-center text-[14px] font-medium text-ink-2">Yuklanmoqda...</p>
      </Shell>
    );
  }

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
  if (!isModerator) {
    return (
      <Shell>
        <div className="rounded-card border border-line/60 bg-card px-4 py-10 text-center">
          <p className="text-[15px] font-extrabold text-ink">Ruxsat yo&apos;q</p>
          <p className="mt-1 text-[13.5px] font-medium text-ink-2">
            Bu sahifa faqat moderatorlar uchun.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ReviewQueue />
    </Shell>
  );
}
