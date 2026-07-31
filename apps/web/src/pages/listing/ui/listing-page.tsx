import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { AgentCard } from '@/entities/agent';
import { Description, Location, ParamsRow, PriceBlock, listingQuery } from '@/entities/listing';
import { ViewCounter } from '@/features/view-counter';
import { ApiError } from '@/shared/api/client';
import { Gallery } from '@/widgets/gallery';
import { NotFoundView } from '@/widgets/not-found';
import { StickyCTA } from '@/widgets/sticky-cta';

export function ListingPage() {
  const { id = '' } = useParams();
  const { data, isPending, error } = useQuery(listingQuery(id));

  if (isPending) {
    return (
      <div className="mx-auto max-w-content">
        <div className="aspect-[4/3] w-full animate-pulse bg-slate-100" />
        <div className="space-y-3 p-4">
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    // 404 — sodda "topilmadi" sahifasi (spec §14). Boshqa xatolar ham shu yerga tushadi.
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-4 text-slate-500">Obyektni yuklab bo'lmadi.</p>;
  }

  return (
    <main
      className="mx-auto max-w-content"
      // Sticky CTA sahifa oxirini yopib qo'ymasligi uchun.
      style={{ paddingBottom: 'calc(var(--cta-height) + env(safe-area-inset-bottom))' }}
    >
      <Gallery images={data.images} alt={data.title} />
      <PriceBlock priceSom={data.priceSom} priceUsd={data.priceUsd} />
      <h1 className="px-4 pt-2 text-base font-medium text-slate-800">{data.title}</h1>
      <ParamsRow
        rooms={data.rooms}
        areaM2={data.areaM2}
        floor={data.floor}
        district={data.district}
      />
      <Description text={data.description} />
      <Location landmark={data.landmark} address={data.address} />
      <AgentCard agent={data.agent} />
      <ViewCounter id={data.id} />
      <StickyCTA phone={data.agent.phone} telegram={data.agent.telegram} />
    </main>
  );
}
