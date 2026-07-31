import { formatPriceSom, formatPriceUsd } from '@rieltor/shared';

interface Props {
  priceSom: string;
  priceUsd: number;
}

export function PriceBlock({ priceSom, priceUsd }: Props) {
  return (
    <div className="px-4 pt-4">
      <p className="text-2xl leading-tight font-bold tracking-tight">{formatPriceSom(priceSom)}</p>
      <p className="mt-0.5 text-base text-slate-500">{formatPriceUsd(priceUsd)}</p>
    </div>
  );
}
