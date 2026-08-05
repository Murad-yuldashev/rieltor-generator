import type { ReactNode } from 'react';
import { formatListedAt } from '@rieltor/shared';
import { Icon } from '@/shared/ui/icon';

interface Props {
  listedAt: string;
  id: string;
  /**
   * The view count loads live and disappears on error — it lives in the `features`
   * layer, so it is injected from outside (FSD).
   */
  viewSlot?: ReactNode;
}

export function ListingMeta({ listedAt, id, viewSlot }: Props) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-2.5 text-xs font-semibold text-ink-3">
      {viewSlot}
      <span className="flex items-center gap-1.5">
        <Icon name="calendar" className="h-[13px] w-[13px]" />
        {formatListedAt(listedAt)}
      </span>
      <span>ID: {id}</span>
    </div>
  );
}
