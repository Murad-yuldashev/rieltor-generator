import { useSession } from '@/entities/session';
import { useCollections } from '@/features/collections';
import { useLeadStats, useMyLeads } from '@/features/leads';
import { usePresentations } from '@/features/presentations';
import { useSubscription } from '@/features/subscription';
import { useWallet } from '@/features/wallet';
import { TrialBanner } from '@/widgets/trial-banner';
import { DashboardKpis } from './dashboard-kpis';
import { LeadPipelinePanel } from './lead-pipeline-panel';
import { PresentationsPanel } from './presentations-panel';
import { QuickLinks } from './quick-links';
import { SubscriptionCard } from './subscription-card';
import { WalletCard } from './wallet-card';

/**
 * Cabinet home (`/`) — the realtor dashboard. On phone it is a single column
 * (source order kept via the `contents` wrappers below); from `lg` it becomes a
 * main + sticky-aside split under a full-width KPI row. Every KPI/widget is derived
 * client-side from data the cabinet already fetches — no dedicated dashboard
 * endpoint. The gate guarantees an active REALTOR, so a subscription is present;
 * the other queries populate progressively.
 */
export function DashboardPage() {
  const { user } = useSession();
  const { data: subscription } = useSubscription();
  const { data: wallet } = useWallet();
  const { data: myLeads } = useMyLeads();
  const { data: leadStats } = useLeadStats();
  const { data: collections } = useCollections();
  const { data: presentations } = usePresentations();

  return (
    <main className="flex flex-col gap-5">
      <header>
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
          {user?.name ? `Salom, ${user.name}` : 'Xush kelibsiz'}
        </h1>
      </header>

      {/* Trial nudge — kept standalone above the KPI row so it stays above the fold
          on phone. The aside SubscriptionCard is a separate, fuller status card. */}
      {subscription?.status === 'TRIAL' && <TrialBanner daysLeft={subscription.daysLeft} />}

      <DashboardKpis
        wallet={wallet}
        myLeads={myLeads}
        leadStats={leadStats}
        collections={collections}
        presentations={presentations}
      />

      {/* Two-column band. On phone the `contents` wrappers dissolve so all children
          share one flex column, ordered by `order-*` to keep a sensible single-column
          reading order; from `lg` each wrapper becomes its own grid column. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <LeadPipelinePanel stats={leadStats} className="order-2 lg:order-none" />
          <PresentationsPanel presentations={presentations} className="order-4 lg:order-none" />
        </div>

        <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5">
          <SubscriptionCard subscription={subscription} className="order-1 lg:order-none" />
          {wallet && (
            <WalletCard balanceSom={wallet.balanceSom} className="order-3 lg:order-none" />
          )}
          <QuickLinks className="order-5 lg:order-none" />
        </aside>
      </div>
    </main>
  );
}
