import { Link } from 'react-router';
import { useSession } from '@/entities/session';
import { useCollections } from '@/features/collections';
import { useNotes } from '@/features/notes';
import { usePresentations } from '@/features/presentations';
import { useSubscription } from '@/features/subscription';
import { Icon, type IconName } from '@/shared/ui/icon';
import { TrialBanner } from '@/widgets/trial-banner';

/**
 * Cabinet navigation. Every entry is now a live link — the last Phase 3.1 feature
 * (collections) shipped in Task 11.
 */
const NAV: { key: string; label: string; icon: IconName; to: string }[] = [
  { key: 'profile', label: 'Profil', icon: 'home', to: '/profile' },
  { key: 'wallet', label: 'Hisobim', icon: 'money', to: '/wallet' },
  { key: 'leads', label: 'Mening leadlarim', icon: 'chart', to: '/leads' },
  { key: 'browse', label: 'E’lonlar', icon: 'search', to: '/browse' },
  { key: 'notes', label: 'Eslatmalar', icon: 'doc', to: '/notes' },
  { key: 'collections', label: 'To‘plamlar', icon: 'heart', to: '/collections' },
  { key: 'presentations', label: 'Taqdimotlar', icon: 'share', to: '/presentations' },
];

export function DashboardPage() {
  const { user } = useSession();
  // The gate only renders this page for an active REALTOR, so a subscription is
  // guaranteed to be present in the cache by the time we get here.
  const { data: subscription } = useSubscription();
  // All three counts are live (notes: Task 10, collections: Task 11, presentations: Task 8).
  const { data: notes } = useNotes();
  const { data: collections } = useCollections();
  const { data: presentations } = usePresentations();

  // Quick counts — the number of collections, notes, and presentations.
  const stats: { key: string; label: string; value: string }[] = [
    {
      key: 'collections',
      label: 'To‘plamlar',
      value: collections ? String(collections.length) : '—',
    },
    { key: 'notes', label: 'Eslatmalar', value: notes ? String(notes.length) : '—' },
    {
      key: 'presentations',
      label: 'Taqdimotlar',
      value: presentations ? String(presentations.length) : '—',
    },
  ];

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
        {stats.map((stat) => (
          <div key={stat.key} className="rounded-card bg-card p-4 shadow-card">
            <p className="text-[26px] font-extrabold leading-none text-ink">{stat.value}</p>
            <p className="mt-1 text-[13px] font-medium text-ink-2">{stat.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">Bo‘limlar</h2>
        <div className="flex flex-col gap-2">
          {NAV.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5 shadow-card"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name={item.icon} className="size-5" />
              </span>
              <span className="flex-1 text-[15px] font-semibold text-ink">{item.label}</span>
              <Icon name="chevronRight" className="size-5 text-ink-3" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
