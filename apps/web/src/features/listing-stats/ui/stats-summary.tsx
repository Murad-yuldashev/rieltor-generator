import type { ListingStats } from '@rieltor/shared';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';
import { SectionCard } from '@/shared/ui/section-card';

/** labelKey, not display text — module scope has no useTranslation(), same pattern
 *  as bottom-nav's NAV_TABS. */
const WINDOWS: { key: 'last7d' | 'last30d'; labelKey: string }[] = [
  { key: 'last7d', labelKey: 'stats.window7d' },
  { key: 'last30d', labelKey: 'stats.window30d' },
];

function StatTile({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-[10px] bg-surface py-2.5">
      <Icon name={icon} className="h-4 w-4 text-ink-3" strokeWidth={2.2} />
      <span className="text-[15px] font-extrabold text-ink">{value}</span>
      <span className="text-[10px] font-bold text-ink-3">{label}</span>
    </div>
  );
}

function IconCount({
  icon,
  value,
  className,
}: {
  icon: IconName;
  value: number;
  className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-1 text-[12.5px] font-bold text-ink-2', className)}>
      <Icon name={icon} className="h-3.5 w-3.5 text-ink-3" strokeWidth={2.2} />
      {value}
    </span>
  );
}

/** Compact, mobile-first (360px) view of GET /api/me/objects/:id/stats (design spec
 *  §8.3): view/call/tg counts for the 7- and 30-day windows, plus the by-ShareLink
 *  breakdown (already scoped to 30 days server-side). */
export function StatsSummary({ stats }: { stats: ListingStats }) {
  const { t } = useTranslation('cabinet');
  return (
    <div className="flex flex-col gap-3">
      <SectionCard title={t('stats.overallTitle')}>
        <div className="flex flex-col gap-3">
          {WINDOWS.map(({ key, labelKey }) => (
            <div key={key}>
              <p className="mb-1.5 text-xs font-bold text-ink-3">{t(labelKey)}</p>
              <div className="flex gap-2">
                <StatTile icon="eye" value={stats[key].views} label={t('stats.views')} />
                <StatTile icon="phone" value={stats[key].callClicks} label={t('stats.calls')} />
                <StatTile icon="telegram" value={stats[key].tgClicks} label={t('telegramLabel')} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('stats.bySourceTitle')}>
        {stats.byShare.length === 0 ? (
          <p className="py-1 text-[13px] font-semibold text-ink-3">{t('stats.noData')}</p>
        ) : (
          <div className="flex flex-col divide-y divide-line/60">
            {stats.byShare.map((row) => (
              <div
                key={row.shareCode ?? 'direct'}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
                  {row.label ?? (row.shareCode ? `#${row.shareCode}` : t('stats.direct'))}
                </span>
                <div className="flex shrink-0 gap-2.5">
                  <IconCount icon="eye" value={row.views} />
                  <IconCount icon="phone" value={row.callClicks} />
                  <IconCount icon="telegram" value={row.tgClicks} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
