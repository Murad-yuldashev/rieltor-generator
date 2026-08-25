import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { formatListedAt, type Notification } from '@rieltor/shared';
import { notificationsQuery, useMarkAllRead } from '@/entities/notification';
import { useSession } from '@/entities/session';
import { PageHeading } from '@/shared/ui/page-heading';
import { AuthPrompt } from './auth-prompt';

function RowSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-[92px] animate-pulse rounded-card bg-card" />
      ))}
    </div>
  );
}

/** No notifications yet — nothing to nudge the seller toward, just a quiet empty state. */
function EmptyState() {
  return (
    <div className="rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
      <p className="text-[40px]">🔔</p>
      <p className="mt-2 text-[16px] font-extrabold tracking-tight">Xabarnoma yo'q</p>
      <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-ink-2">
        Kuzatilayotgan uylaringiz narxi o'zgarganda shu yerda xabar beramiz.
      </p>
    </div>
  );
}

/** One inbox row. Unread rows carry an accent dot; a row with a target deep-links. */
function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (targetId: string) => void;
}) {
  const { title, body, createdAt, readAt, targetId } = notification;
  const isUnread = readAt === null;

  const content = (
    <>
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? 'bg-accent' : 'bg-transparent'}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`truncate text-[15px] ${isUnread ? 'font-extrabold' : 'font-bold'}`}>
            {title}
          </p>
          <span className="shrink-0 text-[12px] text-ink-2">
            {formatListedAt(createdAt.slice(0, 10))}
          </span>
        </div>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{body}</p>
      </div>
    </>
  );

  const className = `flex w-full gap-3 rounded-card border border-line/60 bg-card p-4 text-left shadow-card ${
    isUnread ? 'ring-1 ring-accent/15' : ''
  }`;

  if (targetId) {
    return (
      <button
        type="button"
        onClick={() => onOpen(targetId)}
        className={`${className} transition-colors hover:bg-surface`}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

/**
 * `/notifications` — the in-app inbox. Auth-gated like the cabinet (`AuthPrompt`,
 * no crash for a logged-out visitor). A `PRICE_UPDATE` row deep-links to the
 * tracked property it was raised for.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const { data, isPending: isListPending } = useQuery({
    ...notificationsQuery(),
    enabled: isAuthenticated,
  });
  const markAllRead = useMarkAllRead();

  if (isSessionPending) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center text-[14px] text-ink-2">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPrompt />;

  const isLoading = isListPending;
  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <main>
      <PageHeading
        title="Xabarnomalar"
        subtitle={
          isLoading
            ? 'Yuklanmoqda...'
            : unreadCount > 0
              ? `${unreadCount} ta o'qilmagan`
              : "Hammasi o'qilgan"
        }
      />

      <div className="px-4 pt-3.5 pb-2 desk:max-w-3xl desk:px-0 desk:pt-5">
        {!isLoading && unreadCount > 0 && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="rounded-[12px] border border-line px-4 py-2 text-[13px] font-bold text-ink-2 transition-colors hover:bg-surface disabled:opacity-50"
            >
              Hammasini o'qilgan deb belgilash
            </button>
          </div>
        )}

        {isLoading && <RowSkeleton />}

        {!isLoading && items.length === 0 && <EmptyState />}

        {!isLoading && items.length > 0 && (
          <div className="flex flex-col gap-3">
            {items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={(targetId) => navigate(`/my/properties/${targetId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
