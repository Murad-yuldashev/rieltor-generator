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
import { ViewCounter } from '@/features/view-counter';
import { ApiError } from '@/shared/api/client';
import { SectionCard } from '@/shared/ui/section-card';
import { Gallery } from '@/widgets/gallery';
import { NotFoundView } from '@/widgets/not-found';
import { SiteHeader } from '@/widgets/site-header';
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

  if (isPending) return <PageSkeleton />;

  if (error) {
    // 404 gets the plain "not found" page (spec §14). Other errors land here too.
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Obyektni yuklab bo'lmadi.</p>;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface pb-cta desk:max-w-none">
      {/* The phone version of this page deliberately has no header — the gallery
          runs to the top edge. A desktop window with no header at all just reads
          as broken, so the header joins in at 1440px only. */}
      <div className="hidden desk:block">
        <SiteHeader />
      </div>

      <div className="desk:mx-auto desk:w-full desk:max-w-desk desk:px-8 desk:py-7">
        {/* Two wrappers that are `display: contents` on a phone, so their children
            are direct items of this flex column and keep the original mobile
            order via `order-*`. At 1440px the wrappers turn into real columns. */}
        <main className="flex flex-col gap-3.5 pb-4 desk:grid desk:grid-cols-[1fr_23rem] desk:items-start desk:gap-7 desk:pb-0">
          <div className="contents desk:flex desk:flex-col desk:gap-3.5">
            <div className="order-1 desk:overflow-hidden desk:rounded-card">
              <Gallery images={data.images} alt={data.title} type={data.type} id={data.id} />
            </div>

            <SectionCard title="Tavsif" className="order-4 mx-4 desk:mx-0">
              <Description text={data.description} />
            </SectionCard>

            <SectionCard title="Joylashuv" className="order-5 mx-4 desk:mx-0">
              <Location landmark={data.landmark} address={data.address} />
            </SectionCard>
          </div>

          <aside className="contents desk:sticky desk:top-24 desk:flex desk:flex-col desk:gap-3.5">
            {/* `p-4` on the old wrapper put 16px between the gallery and this card;
                the flex gap is 14px, so 2px come back here. */}
            <SectionCard className="order-2 mx-4 mt-0.5 desk:mx-0 desk:mt-0">
              <PriceBlock
                priceSom={data.priceSom}
                priceUsd={data.priceUsd}
                areaM2={data.areaM2}
                deal={data.deal}
              />
              <h1 className="mt-2.5 text-[17px] leading-[1.35] font-bold">{data.title}</h1>
              <ListingMeta
                listedAt={data.listedAt}
                id={data.id}
                viewSlot={<ViewCounter id={data.id} />}
              />
            </SectionCard>

            <SectionCard className="order-3 mx-4 desk:mx-0">
              <ParamsRow
                rooms={data.rooms}
                areaM2={data.areaM2}
                floor={data.floor}
                district={data.district}
              />
            </SectionCard>

            <SectionCard className="order-6 mx-4 desk:mx-0">
              <AgentCard agent={data.agent} />
            </SectionCard>

            {/* Fixed on a phone, so `order` is inert there; in the desktop sidebar
                it has to sit after the agent card rather than before the price. */}
            <StickyCTA
              phone={data.agent.phone}
              telegram={data.agent.telegram}
              className="order-7"
            />
          </aside>
        </main>
      </div>
    </div>
  );
}
