import { useQuery } from '@tanstack/react-query';
import type { PropertyRequestSummary } from '@rieltor/shared';
import { Link } from 'react-router';
import {
  RequestCard,
  myRequestsQuery,
  useCloseRequest,
  useDeleteRequest,
} from '@/entities/property-request';
import { useSession } from '@/entities/session';
import { cn } from '@/shared/lib/cn';
import { PageHeading } from '@/shared/ui/page-heading';
import { AuthPrompt } from './auth-prompt';

const STATUS_META = {
  CLAIMED: { label: 'Rieltor oldi ✓', className: 'bg-brand-green/10 text-brand-green' },
  OPEN: { label: 'Ochiq', className: 'bg-accent/10 text-accent' },
  CLOSED: { label: 'Yopilgan', className: 'bg-ink-3/10 text-ink-2' },
  EXPIRED: { label: 'Yopilgan', className: 'bg-ink-3/10 text-ink-2' },
} as const;

function StatusChip({ status }: { status: PropertyRequestSummary['status'] }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function RequestRow({ request }: { request: PropertyRequestSummary }) {
  const close = useCloseRequest();
  const remove = useDeleteRequest();

  function onDelete() {
    if (window.confirm("Bu so'rovni o'chirmoqchimisiz?")) remove.mutate(request.id);
  }

  return (
    <RequestCard
      request={request}
      actionSlot={
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={request.status} />
          <div className="ml-auto flex items-center gap-2">
            {request.status === 'OPEN' && (
              <button
                type="button"
                onClick={() => close.mutate(request.id)}
                disabled={close.isPending}
                className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] font-bold text-ink-2 transition-colors hover:bg-surface disabled:opacity-50"
              >
                Yopish
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={remove.isPending}
              className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold text-brand-rose transition-colors hover:bg-brand-rose/10 disabled:opacity-50"
            >
              O'chirish
            </button>
          </div>
        </div>
      }
    />
  );
}

function RowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line/60 bg-card p-4 shadow-card">
      <div className="h-5 w-2/3 animate-pulse rounded bg-line" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
    </div>
  );
}

/** `/my/requests` — the buyer's own "Qidiryapman" requests, with close/delete controls. */
export function MyRequestsPage() {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const { data, isPending, isError } = useQuery({ ...myRequestsQuery(), enabled: isAuthenticated });

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
        title="Mening qidiruvlarim"
        subtitle="Joylagan so'rovlaringiz — yopishingiz yoki o'chirishingiz mumkin"
      />

      <div className="flex flex-col gap-4 px-4 pt-3.5 md:mx-auto md:max-w-2xl desk:max-w-2xl desk:px-0 desk:pt-5">
        {isPending && Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} />)}

        {isError && (
          <p className="px-6 py-12 text-center text-[15px] text-ink-2">
            So'rovlarni yuklab bo'lmadi. Keyinroq urinib ko'ring.
          </p>
        )}

        {!isPending && !isError && data && data.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-[14px] leading-relaxed text-ink-2">Hali qidiruv joylamagansiz.</p>
            <Link
              to="/requests/new"
              className="mt-3 inline-block rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-2.5 text-[13.5px] font-extrabold text-white shadow-lg shadow-accent/35"
            >
              + Qidiruv joylash
            </Link>
          </div>
        )}

        {!isPending &&
          !isError &&
          data?.map((request) => <RequestRow key={request.id} request={request} />)}
      </div>
    </main>
  );
}
