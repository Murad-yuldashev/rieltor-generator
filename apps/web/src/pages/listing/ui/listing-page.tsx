import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { AgentCard } from '@/entities/agent';
import {
  Description,
  ListingMeta,
  Location,
  ParamsRow,
  PriceBlock,
  listingQuery,
} from '@/entities/listing';
import { useShareCode, useTrackView } from '@/features/event-tracking';
import { ViewCounter } from '@/features/view-counter';
import { ApiError } from '@/shared/api/client';
import { SectionCard } from '@/shared/ui/section-card';
import { Gallery } from '@/widgets/gallery';
import { NotFoundView } from '@/widgets/not-found';
import { StickyCTA } from '@/widgets/sticky-cta';

function PageSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface">
      <div className="aspect-[4/3] w-full animate-pulse bg-line" />
      <div className="space-y-3.5 p-4">
        <div className="h-32 animate-pulse rounded-card bg-card" />
        <div className="h-24 animate-pulse rounded-card bg-card" />
        <div className="h-40 animate-pulse rounded-card bg-card" />
      </div>
    </div>
  );
}

export function ListingPage() {
  const { id = '' } = useParams();
  const { data, isPending, error } = useQuery(listingQuery(id));
  const shareCode = useShareCode();
  // Called unconditionally (Rules of Hooks), same as the query above — it only
  // actually fires once `data` confirms the listing exists, so a 404 id is never
  // counted as a view.
  useTrackView(id, Boolean(data));

  if (isPending) return <PageSkeleton />;

  if (error) {
    // 404 gets the plain "not found" page (spec §14). Other errors land here too.
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Obyektni yuklab bo'lmadi.</p>;
  }

  return (
    <div
      className="mx-auto min-h-dvh max-w-content bg-surface"
      // Keeps the sticky CTA from covering the end of the page.
      style={{ paddingBottom: 'calc(var(--cta-height) + env(safe-area-inset-bottom))' }}
    >
      <Gallery images={data.images} alt={data.title} type={data.type} id={data.id} />

      <main className="flex flex-col gap-3.5 p-4">
        <SectionCard>
          <PriceBlock
            priceSom={data.priceSom}
            priceUsd={data.priceUsd}
            areaM2={data.areaM2}
            deal={data.deal}
            priceDropped={data.priceDropped}
          />
          <h1 className="mt-2.5 text-[17px] leading-[1.35] font-bold">{data.title}</h1>
          <ListingMeta
            listedAt={data.listedAt}
            id={data.id}
            viewSlot={<ViewCounter id={data.id} />}
          />
        </SectionCard>

        <SectionCard>
          <ParamsRow
            rooms={data.rooms}
            areaM2={data.areaM2}
            floor={data.floor}
            district={data.district}
          />
        </SectionCard>

        <SectionCard title="Tavsif">
          <Description text={data.description} />
        </SectionCard>

        <SectionCard title="Joylashuv">
          <Location
            landmark={data.landmark}
            address={data.address}
            lat={data.lat}
            lng={data.lng}
            title={data.title}
          />
        </SectionCard>

        <SectionCard>
          <AgentCard agent={data.agent} />
        </SectionCard>
      </main>

      <StickyCTA
        phone={data.agent.phone}
        telegram={data.agent.telegram}
        listingId={data.id}
        shareCode={shareCode}
      />
    </div>
  );
}
