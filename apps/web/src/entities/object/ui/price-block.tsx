import { formatNarxSom, formatNarxUsd } from '@rieltor/shared';

interface Props {
  narxSom: string;
  narxUsd: number;
}

export function PriceBlock({ narxSom, narxUsd }: Props) {
  return (
    <div className="px-4 pt-4">
      <p className="text-2xl leading-tight font-bold tracking-tight">{formatNarxSom(narxSom)}</p>
      <p className="mt-0.5 text-base text-slate-500">{formatNarxUsd(narxUsd)}</p>
    </div>
  );
}
