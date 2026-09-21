import { useSession } from '@/entities/session';
import { useBookings } from '@/features/booking';
import { useContracts } from '@/features/contracts';
import { useComplexes, useOrg } from '@/features/developer';
import { useFinanceSummary } from '@/features/finance';
import { CollectionBar } from './collection-bar';
import { DashboardKpis } from './dashboard-kpis';
import { MembersCard, QuickLinks, VerificationCard } from './org-aside';
import { PipelinePanel } from './pipeline-panel';
import { PortfolioGrid } from './portfolio-grid';

const SHELL = 'flex flex-col gap-5';

/**
 * Cabinet home (`/`) — the organization dashboard. On phone it is a single column
 * (source order kept via the `contents` wrappers below); from `lg` it becomes a
 * main + sticky-aside split under a full-width KPI row. Every KPI/widget is derived
 * client-side from data the cabinet already fetches — no dedicated dashboard
 * endpoint. `useOrg` is the page's gate; the other queries populate progressively.
 */
export function OrganizationPage() {
  const { data: org, isPending, isError } = useOrg();
  const { user } = useSession();
  const { data: summary } = useFinanceSummary();
  const { data: complexes } = useComplexes();
  const { data: bookings } = useBookings();
  const { data: contracts } = useContracts();

  if (isPending) {
    return (
      <main className={SHELL}>
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      </main>
    );
  }

  if (isError || !org) {
    return (
      <main className={SHELL}>
        <p className="text-[14px] font-semibold text-brand-rose">
          Tashkilot ma'lumotini yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      </main>
    );
  }

  return (
    <main className={SHELL}>
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{org.name}</h1>
        <p className="mt-1 text-[14px] text-ink-2">{org.district ?? 'Tuman ko‘rsatilmagan'}</p>
      </header>

      <DashboardKpis
        complexes={complexes}
        bookings={bookings}
        contracts={contracts}
        summary={summary}
      />

      {/* Two-column band. On phone the `contents` wrappers dissolve so all children
          share one flex column, ordered by `order-*` to keep a sensible single-column
          reading order; from `lg` each wrapper becomes its own grid column. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <PortfolioGrid complexes={complexes ?? []} className="order-2" />
          <PipelinePanel
            bookings={bookings ?? []}
            contracts={contracts ?? []}
            className="order-4"
          />
          {summary && (
            <CollectionBar
              collectedSom={summary.collectedSom}
              contractedSom={summary.contractedSom}
              className="order-5"
            />
          )}
        </div>

        <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5">
          <VerificationCard org={org} className="order-1" />
          <MembersCard members={org.members} currentUserId={user?.id} className="order-3" />
          <QuickLinks className="order-6" />
        </aside>
      </div>
    </main>
  );
}
