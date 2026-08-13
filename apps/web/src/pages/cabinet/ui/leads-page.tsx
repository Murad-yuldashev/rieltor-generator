import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMe } from '@/features/auth';
import { myLeadsQuery } from '@/features/leads';
import { myListingsQuery } from '@/features/listing-form';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';
import { LeadRow } from './lead-row';

/**
 * /cabinet/leads (design spec §4.3, §8.4) — a dedicated page rather than folding
 * into the cabinet hub, same reasoning as StatsPage; reached from the "Lidlar" link
 * on the cabinet page.
 */
export function LeadsPage() {
  const { t } = useTranslation('cabinet');
  const { realtor, isLoading: meLoading } = useMe();
  // Deferred until sign-in state is known, same reasoning as StatsPage/EditListingPage.
  const enabled = !meLoading && Boolean(realtor);
  const { data: leads, isPending, error } = useQuery({ ...myLeadsQuery(), enabled });
  // Only used to resolve a lead's listingId into a human-readable title — GET
  // /api/me/leads itself does not carry one (see features/leads/api.ts). Fetched
  // here rather than inside LeadRow because features/leads may not import
  // features/listing-form (FSD forbids one feature importing another).
  const { data: listings } = useQuery({ ...myListingsQuery(), enabled });

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const listing of listings ?? []) map.set(listing.id, listing.title);
    return map;
  }, [listings]);

  if (meLoading) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">{t('common:loading')}</p>
      </main>
    );
  }

  // Publicly reachable route: bounce a signed-out visitor to /cabinet, which owns
  // the sign-in prompt (same convention as ProfilePage/StatsPage).
  if (!realtor) return <Navigate to="/cabinet" replace />;

  if (isPending) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">{t('common:loading')}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-10 text-center">
        <p className="text-[14px] font-semibold text-ink-2">{t('leadsLoadFailed')}</p>
        <Link to="/cabinet" className="mt-3 inline-block text-[13.5px] font-bold text-accent">
          {t('backToCabinet')}
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface pb-10">
      <Link
        to="/cabinet"
        className="mt-3.5 ml-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-accent"
      >
        <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
        {t('backLink')}
      </Link>

      <PageHeading title={t('leadsTitle')} subtitle={t('leadsSubtitle')} />

      <div className="px-4">
        {leads.length === 0 ? (
          <SectionCard>
            <p className="py-2 text-center text-[13.5px] font-semibold text-ink-3">
              {t('leadsEmpty')}
            </p>
          </SectionCard>
        ) : (
          <div className="flex flex-col gap-2.5">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                listingTitle={titleById.get(lead.listingId) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
