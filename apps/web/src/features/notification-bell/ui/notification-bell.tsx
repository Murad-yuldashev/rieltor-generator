import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { notificationsQuery } from '@/entities/notification';
import { useSession } from '@/entities/session';
import { Icon } from '@/shared/ui/icon';

/**
 * Header bell linking to `/notifications`, with an unread badge. The query is
 * gated on the session — an anonymous visitor has nothing to fetch and the whole
 * control renders nothing, so it never draws an empty bell for logged-out users.
 */
export function NotificationBell() {
  const { isAuthenticated } = useSession();
  const { data } = useQuery({ ...notificationsQuery(), enabled: isAuthenticated });

  if (!isAuthenticated) return null;

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Link
      to="/notifications"
      aria-label="Xabarnomalar"
      className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:bg-surface"
    >
      <Icon name="bell" className="h-[18px] w-[18px]" strokeWidth={2.1} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
