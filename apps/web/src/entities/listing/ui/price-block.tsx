import { formatPricePerM2, formatPriceSom, formatPriceUsd, type Deal } from '@rieltor/shared';
import { PriceDroppedBadge } from './price-dropped-badge';

interface Props {
  priceSom: string;
  priceUsd: number;
  areaM2: number;
  deal: Deal;
  /** Shows the "↓ Narx tushdi" badge (design spec §7.6). Optional — callers that
   *  never pass it (e.g. the cabinet edit form) render the price with no badge. */
  priceDropped?: boolean;
}

export function PriceBlock({ priceSom, priceUsd, areaM2, deal, priceDropped = false }: Props) {
  return (
    <>
      {/* 480px da mockupdagi bir qator; tor telefonda avval narx kichrayadi,
          uzun narx + katta m² narxida esa yorliq pastki qatorga tushadi. */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[clamp(18px,5.6vw,26px)] leading-tight font-extrabold tracking-tight whitespace-nowrap text-accent-dark">
          {formatPriceSom(priceSom, deal)}
        </p>
        {priceDropped && <PriceDroppedBadge />}
        {/* "mln/m²" only reads as a price per square metre for a sale — a
            monthly rent divided by the area rounds to nothing. */}
        {deal === 'SALE' && (
          <span className="ml-auto shrink-0 rounded-full bg-accent-soft px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-accent">
            {formatPricePerM2(priceSom, areaM2)}
          </span>
        )}
      </div>
      <p className="mt-1 text-[14.5px] font-bold text-ink-3">{formatPriceUsd(priceUsd, deal)}</p>
    </>
  );
}
