import { Link } from 'react-router';
import { useSession } from '@/entities/session';
import { useSubscription } from '@/features/subscription';
import { Icon, type IconName } from '@/shared/ui/icon';
import { TrialBanner } from '@/widgets/trial-banner';

/**
 * Quick counts. Real values arrive once Tasks 10–11 wire the notes/collections
 * queries; until then the tiles show an em-dash placeholder.
 */
const STATS: { key: string; label: string; value: string }[] = [
  { key: 'collections', label: 'To‘plamlar', value: '—' },
  { key: 'notes', label: 'Eslatmalar', value: '—' },
];

/**
 * Cabinet navigation. Entries with a `to` are live links; the rest land in later
 * Phase 3.1 tasks and stay "tez orada" (coming soon) placeholders rather than
 * routing into an unregistered path.
 */
const NAV: { key: string; label: string; icon: IconName; to?: string }[] = [
  { key: 'profile', label: 'Profil', icon: 'home', to: '/profile' },
  { key: 'browse', label: 'E’lonlar', icon: 'search' },
  { key: 'notes', label: 'Eslatmalar', icon: 'doc' },
  { key: 'collections', label: 'To‘plamlar', icon: 'heart' },
];

export function DashboardPage() {
  const { user } = useSession();
  // The gate only renders this page for an active REALTOR, so a subscription is
  // guaranteed to be present in the cache by the time we get here.
  const { data: subscription } = useSubscription();

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-8">
      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
          {user?.name ? `Salom, ${user.name}` : 'Xush kelibsiz'}
        </h1>
      </header>

      {subscription?.status === 'TRIAL' && (
        <div className="mb-5">
          <TrialBanner daysLeft={subscription.daysLeft} />
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <div key={stat.key} className="rounded-card bg-card p-4 shadow-card">
            <p className="text-[26px] font-extrabold leading-none text-ink">{stat.value}</p>
            <p className="mt-1 text-[13px] font-medium text-ink-2">{stat.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">Bo‘limlar</h2>
        <div className="flex flex-col gap-2">
          {NAV.map((item) => {
            const content = (
              <>
                <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon name={item.icon} className="size-5" />
                </span>
                <span className="flex-1 text-[15px] font-semibold text-ink">{item.label}</span>
                {item.to ? (
                  <Icon name="chevronRight" className="size-5 text-ink-3" />
                ) : (
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-ink-3">
                    tez orada
                  </span>
                )}
              </>
            );

            return item.to ? (
              <Link
                key={item.key}
                to={item.to}
                className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5 shadow-card"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5 shadow-card"
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
