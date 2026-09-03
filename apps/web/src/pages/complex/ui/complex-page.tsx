import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { formatPriceSom, type ComplexStatus } from '@rieltor/shared';
import { complexQuery } from '@/entities/complex';
import { InquiryButton } from '@/features/complex-inquiry';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { SectionCard } from '@/shared/ui/section-card';
import { NotFoundView } from '@/widgets/not-found';
import { SiteHeader } from '@/widgets/site-header';
import { AvailabilityGrid } from './availability-grid';
import { ComplexGallery } from './complex-gallery';

/** Build-status label for the cover badge — same three states as the CRM/card. */
const STATUS_LABEL: Record<ComplexStatus, string> = {
  PLANNED: 'Rejalashtirilgan',
  UNDER_CONSTRUCTION: 'Qurilmoqda',
  DONE: 'Topshirilgan',
};

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

export function ComplexPage() {
  const { slug = '' } = useParams();
  const { data, isPending, error } = useQuery(complexQuery(slug));

  if (isPending) return <PageSkeleton />;

  if (error) {
    // A 404 (slug not published) gets the plain "not found" page, like the listing page.
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Majmuani yuklab bo'lmadi.</p>;
  }

  // The form only offers units a buyer can actually take an interest in.
  const availableUnits = data.buildings.flatMap((building) =>
    building.units
      .filter((unit) => unit.status === 'AVAILABLE')
      .map((unit) => ({
        id: unit.id,
        label: `${building.name} · ${unit.number}${unit.rooms != null ? ` · ${unit.rooms} xona` : ''}`,
      })),
  );

  // Ruling B: no map library. When coordinates exist we link out to OpenStreetMap;
  // otherwise the location block is just the address/district text.
  const mapUrl =
    data.latitude != null && data.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=16/${data.latitude}/${data.longitude}`
      : null;

  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface pb-cta md:max-w-none desk:max-w-none">
      {/* The phone version has no header — the gallery runs to the top edge; the top
          nav joins in from 768px, matching the listing page. */}
      <div className="hidden md:block">
        <SiteHeader />
      </div>

      <div className="lg:px-8 lg:py-7 desk:mx-auto desk:w-full desk:max-w-desk desk:px-8 desk:py-7">
        <main className="flex flex-col gap-3.5 pb-4 lg:grid lg:grid-cols-[1fr_21rem] lg:items-start lg:gap-6 lg:pb-0 desk:grid desk:grid-cols-[1fr_23rem] desk:items-start desk:gap-7 desk:pb-0">
          <div className="contents lg:flex lg:flex-col lg:gap-3.5 desk:flex desk:flex-col desk:gap-3.5">
            <div className="order-1 lg:overflow-hidden lg:rounded-card desk:overflow-hidden desk:rounded-card">
              <ComplexGallery images={data.gallery} name={data.name} />
            </div>

            {data.description && (
              <SectionCard title="Tavsif" className="order-3 mx-4 lg:mx-0 desk:mx-0">
                <p className="text-[14px] leading-relaxed whitespace-pre-line text-ink-2">
                  {data.description}
                </p>
              </SectionCard>
            )}

            <SectionCard title="Joylashuv" className="order-4 mx-4 lg:mx-0 desk:mx-0">
              <p className="flex items-start gap-1.5 text-[14px] font-medium text-ink-2">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={2.2} />
                <span>{data.address ? `${data.address}, ${data.district}` : data.district}</span>
              </p>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[13px] font-bold text-accent-dark"
                >
                  <Icon name="pin" className="h-4 w-4" strokeWidth={2.2} />
                  Xaritada ko'rish
                </a>
              )}
            </SectionCard>

            <SectionCard title="Xonadonlar" className="order-5 mx-4 lg:mx-0 desk:mx-0">
              <AvailabilityGrid buildings={data.buildings} />
            </SectionCard>
          </div>

          <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-3.5 desk:sticky desk:top-24 desk:flex desk:flex-col desk:gap-3.5">
            <SectionCard className="order-2 mx-4 mt-0.5 lg:mx-0 desk:mx-0 desk:mt-0">
              <span className="inline-flex rounded-lg bg-surface px-2 py-1 text-[11.5px] font-bold text-ink-2">
                {STATUS_LABEL[data.buildStatus]}
              </span>

              <p className="mt-2.5 text-xl font-extrabold tracking-tight text-accent-dark">
                {data.priceFromSom !== null
                  ? `${formatPriceSom(data.priceFromSom, 'SALE')}dan`
                  : 'Narx kelishiladi'}
              </p>

              <h1 className="mt-1.5 text-[19px] leading-[1.3] font-extrabold tracking-tight">
                {data.name}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
                <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={2.2} />
                <span className="truncate">{data.district}</span>
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
                <Icon name="rooms" className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.2} />
                {data.unitsAvailable} ta bo'sh / {data.unitsTotal} ta xonadon
              </p>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-line/70 pt-3.5">
                <span className="text-[13px] font-bold text-ink">{data.developerName}</span>
                {/* Same green verified pill as the card — here it certifies the developer. */}
                {data.developerVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
                    <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
                    Tasdiqlangan quruvchi
                  </span>
                )}
              </div>
            </SectionCard>

            <InquiryButton slug={data.slug} units={availableUnits} className="order-6" />
          </aside>
        </main>
      </div>
    </div>
  );
}
