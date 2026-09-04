import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { formatListedAt, type ModeratorDeveloperRow } from '@rieltor/shared';
import { useSession } from '@/entities/session';
import { apiPatch } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { developersQuery, MODERATION_DEVELOPERS_KEY } from '../api';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-ink">Quruvchilarni tasdiqlash</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/moderation/realtors"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Rieltorlar →
          </Link>
          <Link
            to="/moderation/reviews"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Sharhlar →
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

/** The verify/unverify queue — only mounted once the role gate has passed. */
function DeveloperRoster() {
  const { data, isPending, error } = useQuery(developersQuery);
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    // PATCH /api/moderation/developers/:orgId with { verified } — the token is
    // attached by the client. On success the list is invalidated so each row
    // reflects the new state.
    mutationFn: ({ orgId, verified }: { orgId: string; verified: boolean }) =>
      apiPatch(`/api/moderation/developers/${orgId}`, undefined, { verified }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_DEVELOPERS_KEY }),
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
        Quruvchilar yo&apos;q
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {data.map((developer) => (
        <DeveloperItem
          key={developer.orgId}
          developer={developer}
          isUpdating={
            verifyMutation.isPending && verifyMutation.variables?.orgId === developer.orgId
          }
          onToggle={() =>
            verifyMutation.mutate({ orgId: developer.orgId, verified: !developer.verified })
          }
        />
      ))}
    </ul>
  );
}

function DeveloperItem({
  developer,
  isUpdating,
  onToggle,
}: {
  developer: ModeratorDeveloperRow;
  isUpdating: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-line/60 bg-card p-3.5 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
          <span className="truncate">{developer.name}</span>
          {developer.verified && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
              <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
              Tasdiqlangan
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink-3">
          {developer.district ?? 'Tuman ko‘rsatilmagan'} · {developer.complexCount} ta JK
        </p>
        <p className="mt-0.5 text-[12.5px] font-medium text-ink-3">{developer.memberPhone}</p>
        {developer.verificationRequestedAt && (
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-3">
            So&apos;rov: {formatListedAt(developer.verificationRequestedAt.slice(0, 10))}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={isUpdating}
        className={
          developer.verified
            ? 'shrink-0 rounded-[10px] border border-line bg-card px-3.5 py-2 text-[13px] font-extrabold text-ink-2 disabled:opacity-50'
            : 'shrink-0 rounded-[10px] bg-brand-green px-3.5 py-2 text-[13px] font-extrabold text-white disabled:opacity-50'
        }
      >
        {developer.verified ? 'Bekor qilish' : 'Tasdiqlash'}
      </button>
    </li>
  );
}

/**
 * Moderator-only developer verification screen. Rendered outside the tab layout
 * (a full-screen admin surface, same as the realtor/review/conversion screens).
 * The route is not hidden — the gate here is the real client-side protection,
 * backed by the API's bearer-token check.
 */
export function ModerationDevelopersPage() {
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
      <DeveloperRoster />
    </Shell>
  );
}
