import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { AgentCard } from '@/entities/agent';
import { Description, Location, ParamsRow, PriceBlock, objectQuery } from '@/entities/object';
import { ViewCounter } from '@/features/view-counter';
import { ApiXatosi } from '@/shared/api/client';
import { Gallery } from '@/widgets/gallery';
import { NotFoundView } from '@/widgets/not-found';
import { StickyCTA } from '@/widgets/sticky-cta';

export function ObjectPage() {
  const { id = '' } = useParams();
  const { data, isPending, error } = useQuery(objectQuery(id));

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
    if (error instanceof ApiXatosi && error.status === 404) return <NotFoundView />;
    return <p className="p-4 text-slate-500">Obyektni yuklab bo'lmadi.</p>;
  }

  return (
    <main
      className="mx-auto max-w-content"
      // Sticky CTA sahifa oxirini yopib qo'ymasligi uchun.
      style={{ paddingBottom: 'calc(var(--cta-balandlik) + env(safe-area-inset-bottom))' }}
    >
      <Gallery rasmlar={data.rasmlar} alt={data.sarlavha} />
      <PriceBlock narxSom={data.narxSom} narxUsd={data.narxUsd} />
      <h1 className="px-4 pt-2 text-base font-medium text-slate-800">{data.sarlavha}</h1>
      <ParamsRow xona={data.xona} maydonM2={data.maydonM2} qavat={data.qavat} tuman={data.tuman} />
      <Description matn={data.tavsif} />
      <Location moljal={data.moljal} manzil={data.manzil} />
      <AgentCard agent={data.agent} />
      <ViewCounter id={data.id} />
      <StickyCTA tel={data.agent.tel} tg={data.agent.tg} />
    </main>
  );
}
