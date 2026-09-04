import { Link } from 'react-router';
import { formatPriceSom, type ComplexStatus, type PublicComplexSummary } from '@rieltor/shared';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  complex: PublicComplexSummary;
  /** The first card in a list is the LCP candidate — its image loads eagerly (spec §7). */
  isFirst?: boolean;
}

/** Build-status label for the cover badge — same three states as the CRM. */
const STATUS_LABEL: Record<ComplexStatus, string> = {
  PLANNED: 'Rejalashtirilgan',
  UNDER_CONSTRUCTION: 'Qurilmoqda',
  DONE: 'Topshirilgan',
};

export function ComplexCard({ complex, isFirst = false }: Props) {
  return (
    <article className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <Link to={`/jk/${complex.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-line">
          {complex.coverImage && (
            <ResponsiveImage
              image={complex.coverImage}
              alt={complex.name}
              isFirst={isFirst}
              className="h-full w-full"
            />
          )}

          <div className="absolute top-3 left-3">
            <span className="rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
              {STATUS_LABEL[complex.buildStatus]}
            </span>
          </div>
        </div>

        <div className="px-[15px] pt-3.5 pb-[15px]">
          <span className="text-xl font-extrabold tracking-tight text-accent-dark">
            {/* The cheapest available unit is the "narxdan" figure; a complex with no
                priced inventory yet reads as "price on request". */}
            {complex.priceFromSom !== null
              ? `narx — ${formatPriceSom(complex.priceFromSom, 'SALE')}dan`
              : 'Narx kelishiladi'}
          </span>

          <h3 className="mt-1.5 text-[15px] leading-[1.35] font-semibold">{complex.name}</h3>

          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={2.2} />
            <span className="truncate">{complex.district}</span>
          </p>

          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
            <Icon name="rooms" className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.2} />
            {complex.unitsAvailable} ta bo'sh xonadon
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="truncate text-[12.5px] font-bold text-ink-3">
              {complex.developerName}
            </span>
            {/* Same green verified pill as the seller badge on ListingResultRow —
                here it certifies the developer ("Tasdiqlangan quruvchi"). */}
            {complex.developerVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
                <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
                Tasdiqlangan quruvchi
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
