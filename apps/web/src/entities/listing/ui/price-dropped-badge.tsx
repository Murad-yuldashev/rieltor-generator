import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

/**
 * "↓ Narx tushdi" — shown on a card and on the listing page for 7 days after the
 * price is cut (design spec §7.6). A light pill rather than a solid one on purpose:
 * it sits next to <TypeBadge>'s solid colour fills (card variant) and needs to read
 * as a callout, not another category tag.
 */
export function PriceDroppedBadge({ className }: { className?: string }) {
  const { t } = useTranslation('feed');

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide text-brand-rose backdrop-blur-sm',
        className,
      )}
    >
      {t('priceDropped')}
    </span>
  );
}
