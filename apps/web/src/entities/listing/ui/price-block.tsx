import { formatPricePerM2, formatPriceSom, formatPriceUsd } from '@rieltor/shared';

interface Props {
  priceSom: string;
  priceUsd: number;
  areaM2: number;
}

export function PriceBlock({ priceSom, priceUsd, areaM2 }: Props) {
  return (
    <>
      {/* 480px da mockupdagi bir qator; tor telefonda avval narx kichrayadi,
          uzun narx + katta m² narxida esa yorliq pastki qatorga tushadi. */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[clamp(18px,5.6vw,26px)] leading-tight font-extrabold tracking-tight whitespace-nowrap text-accent-dark">
          {formatPriceSom(priceSom)}
        </p>
        <span className="ml-auto shrink-0 rounded-full bg-accent-soft px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-accent">
          {formatPricePerM2(priceSom, areaM2)}
        </span>
      </div>
      <p className="mt-1 text-[14.5px] font-bold text-ink-3">{formatPriceUsd(priceUsd)}</p>
    </>
  );
}
